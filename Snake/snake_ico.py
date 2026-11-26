from PIL import Image, ImageDraw

# Create a blank image with transparent background
image = Image.new('RGBA', (512, 512), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)

# Draw the apple shape
draw.ellipse((100, 100, 400, 400), fill='red', outline='black')
draw.rectangle((230, 50, 280, 150), fill='green', outline='black')

# Crop the image to the apple shape
cropped_image = image.crop((100, 50, 400, 400))

# Save the cropped image as a .ico file
cropped_image.save('apple_icon.ico')
