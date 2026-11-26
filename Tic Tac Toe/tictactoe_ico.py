# tictactoe ico v2
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Circle
from PIL import Image

# Create a figure and axis
fig, ax = plt.subplots(figsize=(9, 9))

# Draw a circle using a Circle patch
circle = Circle((0, 0), radius=1, color='blue', linewidth=50, fill=False)
ax.add_patch(circle)

# Draw a cross (X) inside the circle
line_width = 50
ax.plot([-1, 1], [-1, 1], color='red', linewidth=line_width)
ax.plot([-1, 1], [1, -1], color='red', linewidth=line_width)

# Set axis limits
ax.set_xlim(-1.5, 1.5)
ax.set_ylim(-1.5, 1.5)

# Remove axis ticks, labels, and make background transparent
ax.axis('off')
ax.set_facecolor('none')

# Save the plot as a transparent PNG file
plt.savefig('spromits.png', bbox_inches='tight', transparent=True, dpi=600)

# Close the plot to free memory
plt.close(fig)

ico_filename = 'spromits.ico'
img = Image.open('spromits.png')
img.save(ico_filename, format='ICO', sizes=[(256, 256)])
