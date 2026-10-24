/* A dependency-free OOXML/ZIP reader-writer for verified playlist imports.
   Delete the confirmed worksheet row and shift subsequent rows and hyperlinks up; preserve unrelated ZIP members/VBA. */
(() => {
  'use strict';
  const decoder = new TextDecoder('utf-8');
  const encoder = new TextEncoder();
  const XMLNS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const RNS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const isYouTube = value => /^https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?[^#]*\bv=|youtu\.be\/)[A-Za-z0-9_-]{11}/i.test(String(value || ''));
  const read16 = (d, i) => d.getUint16(i, true);
  const read32 = (d, i) => d.getUint32(i, true);
  function write16(out, at, n) { out[at] = n & 255; out[at+1] = (n>>>8)&255; }
  function write32(out, at, n) { write16(out,at,n); write16(out,at+2,n>>>16); }
  function assert(condition, message) { if (!condition) throw new Error(message); }
  let crcTable;
  function crc32(bytes) {
    if (!crcTable) crcTable = Array.from({length:256}, (_,n) => {
      for(let j=0;j<8;j++) n = (n&1) ? (0xEDB88320 ^ (n>>>1)) : (n>>>1);
      return n>>>0;
    });
    let c = 0xFFFFFFFF;
    for (const b of bytes) c = crcTable[(c^b)&255] ^ (c>>>8);
    return (c^0xFFFFFFFF)>>>0;
  }
  function parseXML(value) {
    const doc = new DOMParser().parseFromString(value, 'application/xml');
    if (doc.querySelector('parsererror')) throw new Error('Malformed Excel worksheet XML');
    return doc;
  }
  function attr(n,name) { return n?.getAttribute(name) ?? ''; }
  function local(n,name) { return Array.from(n.getElementsByTagName('*')).filter(e=>e.localName === name); }
  function decodePath(base,target) {
    if (!target) return '';
    const raw = target.startsWith('/') ? target.slice(1) : base + '/' + target;
    const parts=[];
    for (const p of raw.replaceAll('\\','/').split('/')) {
      if (!p || p === '.') continue;
      if (p === '..') parts.pop(); else parts.push(p);
    }
    return parts.join('/');
  }
  class Archive {
    constructor(bytes) {
      this.source = new Uint8Array(bytes);
      const d = new DataView(this.source.buffer, this.source.byteOffset, this.source.byteLength);
      let end=-1;
      for (let p=this.source.length-22;p>=Math.max(0,this.source.length-65557);p--) {
        if (read32(d,p) === 0x06054b50) { end=p; break; }
      }
      assert(end>=0,'Not an Excel ZIP workbook');
      const count=read16(d,end+10), offset=read32(d,end+16);
      assert(count!==0xffff && offset!==0xffffffff,'ZIP64 workbooks are not supported');
      this.items=new Map();
      let p=offset;
      for(let i=0;i<count;i++) {
        assert(read32(d,p)===0x02014b50,'Damaged ZIP central directory');
        const method=read16(d,p+10), flags=read16(d,p+8), crc=read32(d,p+16), csize=read32(d,p+20), usize=read32(d,p+24);
        const nameLen=read16(d,p+28), extraLen=read16(d,p+30), commentLen=read16(d,p+32);
        const filename=decoder.decode(this.source.subarray(p+46,p+46+nameLen));
        const localOffset=read32(d,p+42);
        assert(read32(d,localOffset)===0x04034b50,'Damaged ZIP entry');
        const dataOffset=localOffset+30+read16(d,localOffset+26)+read16(d,localOffset+28);
        assert(dataOffset+csize<=this.source.length,'ZIP member outside archive');
        assert(!(flags&1),'Encrypted workbooks are not supported');
        this.items.set(filename,{name:filename,method,flags,crc,csize,usize,
          bytes:this.source.subarray(dataOffset,dataOffset+csize),
          modTime:read16(d,p+12),modDate:read16(d,p+14),
          versionMade:read16(d,p+4),externalAttr:read32(d,p+38),
          internalAttr:read16(d,p+36), comment:this.source.subarray(p+46+nameLen+extraLen,p+46+nameLen+extraLen+commentLen)});
        p+=46+nameLen+extraLen+commentLen;
      }
      assert(this.items.has('[Content_Types].xml'),'Not an OOXML workbook');
    }
    async bytesOf(filename){
      const entry=this.items.get(filename);
      if(!entry)throw new Error('Workbook entry missing: '+filename);
      if(entry.method===0)return new Uint8Array(entry.bytes);
      assert(entry.method===8,'Unsupported ZIP compression: '+entry.method);
      const stream=new Blob([entry.bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      const expanded=new Uint8Array(await new Response(stream).arrayBuffer());
      assert(expanded.length===entry.usize,'Invalid uncompressed ZIP entry size');
      return expanded;
    }
    async textOf(filename){return decoder.decode(await this.bytesOf(filename));}
    replaceText(name,text){
      const entry=this.items.get(name);assert(entry,`Cannot update missing sheet ${name}`);
      const bytes=encoder.encode(text);
      this.items.set(name,{...entry,method:0,flags:2048,crc:crc32(bytes),csize:bytes.length,usize:bytes.length,bytes});
    }
    output(){
      const parts=[],central=[];
      let offset=0;
      for(const entry of this.items.values()){
        const name=encoder.encode(entry.name),comment=entry.comment || new Uint8Array();
        const head=new Uint8Array(30+name.length);
        write32(head,0,0x04034b50);write16(head,4,20);write16(head,6,2048);
        write16(head,8,entry.method);write16(head,10,entry.modTime);write16(head,12,entry.modDate);
        write32(head,14,entry.crc);write32(head,18,entry.csize);write32(head,22,entry.usize);write16(head,26,name.length);
        head.set(name,30);parts.push(head,entry.bytes);
        const record=new Uint8Array(46+name.length+comment.length);
        write32(record,0,0x02014b50);write16(record,4,entry.versionMade||20);write16(record,6,20);
        write16(record,8,2048);write16(record,10,entry.method);write16(record,12,entry.modTime);
        write16(record,14,entry.modDate);write32(record,16,entry.crc);write32(record,20,entry.csize);
        write32(record,24,entry.usize);write16(record,28,name.length);write16(record,32,comment.length);
        write16(record,36,entry.internalAttr||0);write32(record,38,entry.externalAttr||0);
        write32(record,42,offset);record.set(name,46);record.set(comment,46+name.length);
        central.push(record);offset+=head.length+entry.bytes.length;
      }
      assert(offset<0xFFFFFFFF,'Workbook is too large for ordinary ZIP');
      const dirStart=offset;
      for(const record of central){parts.push(record);offset+=record.length;}
      assert(this.items.size<=65535 && offset<0xFFFFFFFF,'Workbook requires ZIP64');
      const eocd=new Uint8Array(22);write32(eocd,0,0x06054b50);
      write16(eocd,8,this.items.size);write16(eocd,10,this.items.size);
      write32(eocd,12,offset-dirStart);write32(eocd,16,dirStart);parts.push(eocd);
      return new Blob(parts,{type:'application/vnd.ms-excel.sheet.macroEnabled.12'});
    }
  }
  function colIndex(col){let n=0;for(const x of col.toUpperCase())n=n*26+x.charCodeAt(0)-64;return n-1;}
  function colName(idx){let n=idx+1,s='';while(n){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26);}return s;}
  function getCellValue(cell,shared){
    if(!cell)return '';
    const type=attr(cell,'t'),v=Array.from(cell.children).find(x=>x.localName==='v');
    const inline=Array.from(cell.children).find(x=>x.localName==='is');
    const f=Array.from(cell.children).find(x=>x.localName==='f');
    if(f?.textContent?.toUpperCase().includes('HYPERLINK(')){
      const match=f.textContent.match(/HYPERLINK\s*\(\s*"([^"]+)"/i);
      if(match)return match[1];
    }
    if(type==='s'&&v)return shared[Number(v.textContent)]||'';
    if(type==='inlineStr'&&inline)return inline.textContent||'';
    return v?.textContent||cell.textContent||'';
  }
  function hyperlinkFrom(value) {
    const raw=String(value||'').trim();
    const m=raw.match(/https?:\/\/(?:www\.)?youtube\.com\/watch\?[^\s"'<>]*?v=[A-Za-z0-9_-]{11}/i)
      || raw.match(/https?:\/\/youtu\.be\/[A-Za-z0-9_-]{11}/i);
    if(!m)return null;
    try{const u=new URL(m[0]);const id=u.hostname.endsWith('youtu.be')?u.pathname.slice(1):u.searchParams.get('v');
      return /^[\w-]{11}$/.test(id||'')?`https://www.youtube.com/watch?v=${id}`:null;
    }catch{return null;}
  }
  async function loadWorkbook(file,preferredSheetPath=null){
    const archive=new Archive(await file.arrayBuffer());
    const workbook=parseXML(await archive.textOf('xl/workbook.xml'));
    const workbookRels=parseXML(await archive.textOf('xl/_rels/workbook.xml.rels'));
    const drawingPaths=[...archive.items.keys()].filter(x=>x.startsWith('xl/drawings/') && x.endsWith('.xml'));
    const drawingAnchorsSafe=(await Promise.all(drawingPaths.map(async path=>{
      const drawing=parseXML(await archive.textOf(path));
      return drawing.documentElement && !Array.from(drawing.documentElement.children).length;
    }))).every(Boolean);
    const idToPath=new Map(local(workbookRels,'Relationship').map(x=>[attr(x,'Id'),decodePath('xl',attr(x,'Target'))]));
    const shared=archive.items.has('xl/sharedStrings.xml')
      ?local(parseXML(await archive.textOf('xl/sharedStrings.xml')),'si').map(x=>x.textContent||''):[];
    const options=[];
    for(const sheet of local(workbook,'sheet')) {
      const ref=sheet.getAttributeNS(RNS,'id')||attr(sheet,'r:id');
      const sheetPath=idToPath.get(ref);
      if(!sheetPath || !archive.items.has(sheetPath))continue;
      const doc=parseXML(await archive.textOf(sheetPath));
      const sheetRelsPath=sheetPath.slice(0,sheetPath.lastIndexOf('/')+1)+'_rels/'+sheetPath.slice(sheetPath.lastIndexOf('/')+1)+'.rels';
      const hyperlinkMap=new Map();
      if(archive.items.has(sheetRelsPath)) {
        const rels=parseXML(await archive.textOf(sheetRelsPath));
        const relMap=new Map(local(rels,'Relationship').map(x=>[attr(x,'Id'),attr(x,'Target')]));
        for(const h of local(doc,'hyperlink')){
          const ref=attr(h,'ref');const rid=h.getAttributeNS(RNS,'id')||attr(h,'r:id');
          hyperlinkMap.set(ref,relMap.get(rid)||attr(h,'location')||attr(h,'display'));
        }
      }
      const linkItems=[],colsInUse=new Set();
      const rows=local(doc,'sheetData')[0] ? local(local(doc,'sheetData')[0],'row') : [];
      const cellsByCoord=new Map();
      for(const row of rows){for(const c of Array.from(row.children).filter(x=>x.localName==='c')){
        const ref=attr(c,'r');const m=ref.match(/^([A-Z]+)(\d+)$/i);if(!m)continue;
        const ci=colIndex(m[1]);colsInUse.add(ci);
        const value=getCellValue(c,shared);
        cellsByCoord.set(ref,{value,cell:c});
        const f=Array.from(c.children).find(x=>x.localName==='f')?.textContent||'';
        const caption=f.match(/HYPERLINK\s*\(\s*"[^"]+"\s*,\s*"((?:[^"]|"")*)"/i);
        const display=caption?caption[1].replaceAll('""','"'):value;
        const link=hyperlinkFrom(hyperlinkMap.get(ref))||hyperlinkFrom(value);
        if(link && Number(m[2])>=1) linkItems.push({cell:ref,row:Number(m[2]),col:ci,url:link,title:String(display).slice(0,170)});
      }}
      // Hyperlinks may point at blank formatted cells; read these too.
      for(const [ref,val] of hyperlinkMap)if(!cellsByCoord.has(ref)){
        const m=ref.match(/^([A-Z]+)(\d+)$/i),link=hyperlinkFrom(val);
        if(m&&link){linkItems.push({cell:ref,row:Number(m[2]),col:colIndex(m[1]),url:link,title:''});colsInUse.add(colIndex(m[1]));}
      }
      const unique=new Map(linkItems.map(item=>[item.cell,item]));
      options.push({name:attr(sheet,'name'),sheetPath,doc,rows,cellsByCoord,colsInUse,links:[...unique.values()]});
    }
    options.sort((a,b)=>b.links.length-a.links.length);
    const best=(preferredSheetPath && options.find(x=>x.sheetPath===preferredSheetPath)) || options[0];
    assert(best && (best.links.length || preferredSheetPath===best.sheetPath),
      'No direct YouTube watch URLs found. Import a workbook containing video hyperlinks, not search pages.');
    const links=best.links.sort((a,b)=>a.row-b.row);
    // Use an existing Status column when present, or add one after the last used column.
    let statusCol=null;
    for(const [ref,value] of best.cellsByCoord){
      if(/^[A-Z]+1$/.test(ref)&&/^status$|^playlist status$/i.test(value.value.trim()))statusCol=colIndex(ref.match(/^[A-Z]+/)[0]);
    }
    if(statusCol===null)statusCol=best.colsInUse.size?Math.max(...best.colsInUse)+1:1;
    assert(statusCol<16384,'No free Excel column for status');
    const statusLetter=colName(statusCol);
    const items=links.filter(item=>item.col!==statusCol).map((item,i)=>({
      id:`${best.sheetPath}:${item.cell}:${item.url}`,index:i,row:item.row,cell:item.cell,url:item.url,
      title:(!item.title || isYouTube(item.title)) ? (best.cellsByCoord.get(`${colName(item.col-1)}${item.row}`)?.value || `Video ${i+1}`) : item.title,
      status:/^(added|done|complete|completed|already added)$/i.test(best.cellsByCoord.get(`${statusLetter}${item.row}`)?.value||'')?'added':'pending'
    }));
    assert(items.length || preferredSheetPath===best.sheetPath,'No video links found outside the status column');
    return {archive,doc:best.doc,sheetPath:best.sheetPath,sheetName:best.name,statusCol,statusLetter,items,fileName:file.name,hasVBA:archive.items.has('xl/vbaProject.bin'),drawingAnchorsSafe};
  }
  function setStatus(workbook,rowNumber,status){
    const {doc,statusLetter,items}=workbook;
    const sheetData=local(doc,'sheetData')[0];assert(sheetData,'Excel sheetData is missing');
    function writeCell(rowNumber,value){
      let row=Array.from(sheetData.children).find(x=>x.localName==='row'&&Number(attr(x,'r'))===rowNumber);
      if(!row){
        row=doc.createElementNS(XMLNS,'row');row.setAttribute('r',String(rowNumber));
        const after=Array.from(sheetData.children).find(x=>x.localName==='row'&&Number(attr(x,'r'))>rowNumber);
        if(after)sheetData.insertBefore(row,after);else sheetData.appendChild(row);
      }
      const addr=statusLetter+rowNumber;
      let c=Array.from(row.children).find(x=>x.localName==='c'&&attr(x,'r')===addr);
      if(!c){c=doc.createElementNS(XMLNS,'c');c.setAttribute('r',addr);row.appendChild(c);}
      c.setAttribute('t','inlineStr');while(c.firstChild)c.removeChild(c.firstChild);
      const is=doc.createElementNS(XMLNS,'is');const t=doc.createElementNS(XMLNS,'t');t.textContent=value;is.appendChild(t);c.appendChild(is);
    }
    writeCell(1,'Status');writeCell(rowNumber,status);
    const dimension=local(doc,'dimension')[0];
    if(dimension){
      const old=attr(dimension,'ref'),m=old.match(/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/i);
      if(m){const lastCol=colName(Math.max(colIndex(m[3]||m[1]),workbook.statusCol));
        dimension.setAttribute('ref',`A1:${lastCol}${Math.max(Number(m[4]||m[2]),Math.max(...items.map(x=>x.row)))}`);}
    }
  }
  function removeTrack(workbook,item){
    // Excel row deletion, not merely clearing one cell: every row below the
    // confirmed entry moves up, including hyperlink references and row metadata.
    // Stop rather than risk corrupting a workbook with features whose range
    // references require Excel's formula/reference rewriting engine.
    assert(item && workbook.items.some(x=>x.id===item.id),
      'Expected song is not present in the selected worksheet');
    const doc=workbook.doc, sheetData=local(doc,'sheetData')[0];
    assert(sheetData,'Excel sheetData is missing');
    const unsafe=['mergeCells','conditionalFormatting','dataValidations','tableParts',
      'autoFilter','sortState','pivotTableParts','rowBreaks','oleObjects',
      'controls','legacyDrawing','protectedRanges','sheetProtection','extLst'];
    for(const tag of unsafe){
      assert(!local(doc,tag).length,
        'Cannot safely shift rows: this worksheet contains '+tag+'. Workbook left unchanged.');
    }
    assert(!local(doc,'f').length,
      'Cannot safely shift rows containing formulas. Workbook left unchanged.');
    const drawingAnchors=[...workbook.archive.items.keys()]
      .filter(x=>x.startsWith('xl/drawings/') && x.endsWith('.xml'));
    // Empty drawing XML (such as Google Sheets exporter metadata) is harmless.
    // Drawings anchored to rows must be shifted by Excel, not blindly rewritten.
    if(drawingAnchors.length){
      assert(workbook.drawingAnchorsSafe===true,
        'Cannot safely shift rows with anchored drawings. Workbook left unchanged.');
    }
    const rows=Array.from(sheetData.children).filter(x=>x.localName==='row');
    for(const row of rows){
      const n=Number(attr(row,'r'));
      assert(Number.isSafeInteger(n) && n>0, 'Invalid worksheet row number');
      for(const c of Array.from(row.children).filter(x=>x.localName==='c')){
        const m=attr(c,'r').match(/^([A-Z]+)(\d+)$/i);
        assert(m && Number(m[2])===n,'Invalid worksheet cell reference');
      }
    }
    for(const h of local(doc,'hyperlink'))
      assert(/^[A-Z]+\d+$/i.test(attr(h,'ref')),
        'Complex hyperlink ranges cannot be row-shifted safely');
    for(const row of rows){
      const oldRow=Number(attr(row,'r'));
      assert(Number.isSafeInteger(oldRow) && oldRow>0,'Invalid worksheet row number');
      if(oldRow===item.row){sheetData.removeChild(row);continue;}
      if(oldRow<item.row)continue;
      row.setAttribute('r',String(oldRow-1));
      for(const cell of Array.from(row.children).filter(x=>x.localName==='c')){
        const ref=attr(cell,'r'),m=ref.match(/^([A-Z]+)(\d+)$/i);
        assert(m && Number(m[2])===oldRow,'Unexpected worksheet cell reference '+ref);
        cell.setAttribute('r',m[1]+String(oldRow-1));
      }
    }
    for(const parent of local(doc,'hyperlinks')){
      for(const h of Array.from(parent.children).filter(x=>x.localName==='hyperlink')){
        const ref=attr(h,'ref'),m=ref.match(/^([A-Z]+)(\d+)$/i);
        assert(m,'Cannot shift complex hyperlink reference '+ref);
        const r=Number(m[2]);
        if(r===item.row)parent.removeChild(h);
        else if(r>item.row)h.setAttribute('ref',m[1]+String(r-1));
      }
      if(!parent.children.length)parent.parentNode?.removeChild(parent);
    }
    const dimension=local(doc,'dimension')[0];
    if(dimension){
      const remaining=Array.from(sheetData.children).filter(x=>x.localName==='row');
      const last=remaining.reduce((max,r)=>Math.max(max,Number(attr(r,'r'))),1);
      const old=attr(dimension,'ref');
      const match=old.match(/^([A-Z]+)\d+(?::([A-Z]+)\d+)?$/i);
      if(match)dimension.setAttribute('ref',`${match[1]}1:${match[2]||match[1]}${last}`);
    }
    workbook.items=workbook.items.filter(x=>x.id!==item.id);
  }
  function serialize(workbook){workbook.archive.replaceText(workbook.sheetPath,new XMLSerializer().serializeToString(workbook.doc));return workbook.archive.output();}
  window.ZipWorkbook={loadWorkbook,setStatus,removeTrack,serialize,hyperlinkFrom,Archive,crc32};
})();
