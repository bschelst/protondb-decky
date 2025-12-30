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

