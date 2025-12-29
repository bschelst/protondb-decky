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

    async def get_system_info(self):
        """
        Get system information including plugin version, OS, and Decky version
        Returns: {"plugin_version": str, "os_name": str, "os_version": str, "decky_version": str}
        """
        try:
            # Get plugin version from decky_plugin module
            plugin_version = getattr(decky_plugin, 'DECKY_PLUGIN_VERSION', 'unknown')

            # Get OS info from /etc/os-release
            os_name = "Linux"
            os_version = "unknown"
            os_release_path = '/etc/os-release'
            if os.path.exists(os_release_path):
                try:
                    with open(os_release_path, 'r') as f:
                        for line in f:
                            if line.startswith('NAME='):
                                os_name = line.split('=')[1].strip().strip('"')
                            elif line.startswith('VERSION_ID='):
                                os_version = line.split('=')[1].strip().strip('"')
                except:
                    pass

            # Get Decky version
            decky_version = getattr(decky_plugin, 'DECKY_VERSION', 'unknown')

            return {
                "plugin_version": plugin_version,
                "os_name": os_name,
                "os_version": os_version,
                "decky_version": str(decky_version)
            }
        except Exception as e:
            print(f"Error getting system info: {e}")
            return {
                "plugin_version": "unknown",
                "os_name": "unknown",
                "os_version": "unknown",
                "decky_version": "unknown"
            }

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