import os
import json
import decky_plugin
from settings import SettingsManager

class Plugin:
    async def _main(self):
         self.settings = SettingsManager(name="config", settings_directory=decky_plugin.DECKY_PLUGIN_SETTINGS_DIR)

    async def _unload(self):
        pass

    async def set_setting(self, key, value):
        self.settings.setSetting(key, value)

    async def get_setting(self, key, default):
        return self.settings.getSetting(key, default)

    async def check_original_plugin(self):
        """
        Check if the original protondb-decky plugin is installed
        Returns: {"installed": bool, "version": str|None}
        """
        try:
            # Decky plugins directory
            plugins_dir = os.path.expanduser('~/homebrew/plugins/')
            original_plugin_path = os.path.join(plugins_dir, 'protondb-decky')

            if os.path.exists(original_plugin_path):
                # Try to read version from plugin.json or package.json
                version = None

                # First try plugin.json
                plugin_json_path = os.path.join(original_plugin_path, 'plugin.json')
                if os.path.exists(plugin_json_path):
                    try:
                        with open(plugin_json_path, 'r') as f:
                            plugin_info = json.load(f)
                            version = plugin_info.get('version')
                    except:
                        pass

                # If not found, try package.json
                if not version:
                    package_json_path = os.path.join(original_plugin_path, 'package.json')
                    if os.path.exists(package_json_path):
                        try:
                            with open(package_json_path, 'r') as f:
                                package_info = json.load(f)
                                version = package_info.get('version')
                        except:
                            pass

                # If still not found, mark as unknown
                if not version:
                    version = 'unknown'

                return {"installed": True, "version": version}

            return {"installed": False, "version": None}
        except Exception as e:
            # Log error but don't crash
            print(f"Error checking for original plugin: {e}")
            return {"installed": False, "version": None}