import os
import json

base_dir = "/home/matheus/Documents/Códigos/CasesLB"
design_systems = ["AntDesign", "Chakra", "LogicalBrutalism", "Mantine", "MaterialDesign"]

mapping = {
    "dashboard financeiro": "financial-dashboard",
    "inventory erp": "inventory-erp",
    "inventoryerp": "inventory-erp",
    "centro de controle de servidores": "server-control-center",
}

def get_new_name(old_name):
    low = old_name.lower()
    if "orderbook" in low or "order book" in low:
        return "order-book"
    for k, v in mapping.items():
        if k in low:
            return v
    return old_name # fallback

for ds in design_systems:
    ds_path = os.path.join(base_dir, ds)
    if not os.path.isdir(ds_path):
        continue
    
    for app_folder in os.listdir(ds_path):
        app_path = os.path.join(ds_path, app_folder)
        if not os.path.isdir(app_path):
            continue
            
        new_folder_name = get_new_name(app_folder)
        new_app_path = os.path.join(ds_path, new_folder_name)
        
        if app_path != new_app_path:
            os.rename(app_path, new_app_path)
            print(f"Renamed {ds}/{app_folder} -> {ds}/{new_folder_name}")
            
        # Update package.json
        pkg_path = os.path.join(new_app_path, "package.json")
        if os.path.isfile(pkg_path):
            with open(pkg_path, "r", encoding="utf-8") as f:
                try:
                    pkg_data = json.load(f)
                except json.JSONDecodeError:
                    pkg_data = None
            
            if pkg_data:
                new_pkg_name = f"{ds.lower()}-{new_folder_name}"
                pkg_data["name"] = new_pkg_name
                with open(pkg_path, "w", encoding="utf-8") as f:
                    json.dump(pkg_data, f, indent=2)
                print(f"Updated package.json name to {new_pkg_name} in {new_app_path}")
                
        # Delete package-lock.json to avoid sync conflicts on root install
        lock_path = os.path.join(new_app_path, "package-lock.json")
        if os.path.isfile(lock_path):
            os.remove(lock_path)
