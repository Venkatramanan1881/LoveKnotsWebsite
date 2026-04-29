import os
import shutil
from PIL import Image

def reorganize_and_convert(base_dir):
    jpeg_dir = os.path.join(base_dir, "jpeg")
    webp_dir = os.path.join(base_dir, "webp")
    
    # Ensure base directories exist
    os.makedirs(jpeg_dir, exist_ok=True)
    os.makedirs(webp_dir, exist_ok=True)
    
    valid_extensions = ('.jpg', '.jpeg', '.png')
    converted_count = 0
    moved_count = 0
    
    # Step 1: Find all category folders in base_dir and move them to 'jpeg'
    for item in os.listdir(base_dir):
        item_path = os.path.join(base_dir, item)
        
        # Only process directories that aren't our new 'jpeg' or 'webp' folders
        if os.path.isdir(item_path) and item not in ("jpeg", "webp"):
            category_name = item
            
            cat_jpeg_dir = os.path.join(jpeg_dir, category_name)
            cat_webp_dir = os.path.join(webp_dir, category_name)
            
            os.makedirs(cat_jpeg_dir, exist_ok=True)
            os.makedirs(cat_webp_dir, exist_ok=True)
            
            # Move images from the old category folder to the new jpeg category folder
            for file in os.listdir(item_path):
                file_path = os.path.join(item_path, file)
                if os.path.isfile(file_path):
                    ext = os.path.splitext(file)[1].lower()
                    if ext in valid_extensions:
                        dest_path = os.path.join(cat_jpeg_dir, file)
                        shutil.move(file_path, dest_path)
                        moved_count += 1
                        print(f"Moved: {file} -> jpeg/{category_name}/")
                        
            # Remove the old category folder if it's empty
            try:
                if not os.listdir(item_path):
                    os.rmdir(item_path)
            except OSError:
                pass # Folder not empty (maybe contained non-image files), skip removal
                
    # Step 2: Convert all images from 'jpeg' folder and save them to 'webp' folder
    for root, _, files in os.walk(jpeg_dir):
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in valid_extensions:
                src_file_path = os.path.join(root, file)
                
                # Determine relative path to maintain subfolder structure
                rel_path = os.path.relpath(src_file_path, jpeg_dir)
                dest_file_path = os.path.join(webp_dir, os.path.splitext(rel_path)[0] + '.webp')
                
                # Ensure destination subfolder exists
                os.makedirs(os.path.dirname(dest_file_path), exist_ok=True)

                
                try:
                    with Image.open(src_file_path) as img:
                        if img.mode not in ('RGB', 'RGBA'):
                            img = img.convert('RGBA')
                        
                        # Downscale large images to max 1600px to drastically reduce file size
                        img.thumbnail((1600, 1600))
                        
                        img.save(dest_file_path, 'webp', quality=75)
                    
                    print(f"Converted: {rel_path} -> webp/{os.path.splitext(rel_path)[0]}.webp")
                    converted_count += 1
                except Exception as e:
                    print(f"Error converting {src_file_path}: {e}")

    print(f"\nOperation complete! Moved {moved_count} original files to 'jpeg' and generated {converted_count} 'webp' files.")

if __name__ == "__main__":
    target_directory = os.path.join("Images", "Services")
    
    if os.path.exists(target_directory):
        print(f"Starting reorganization and conversion in: {target_directory}\n")
        reorganize_and_convert(target_directory)
    else:
        print(f"Error: Directory '{target_directory}' not found. Please ensure you're running this from the correct folder.")
