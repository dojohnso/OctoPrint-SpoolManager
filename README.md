# OctoPrint-SpoolManager

[![Version](https://img.shields.io/badge/dynamic/json.svg?color=brightgreen&label=version&url=https://api.github.com/repos/dojohnso/OctoPrint-SpoolManager/releases&query=$[0].name)]()
[![Released](https://img.shields.io/badge/dynamic/json.svg?color=brightgreen&label=released&url=https://api.github.com/repos/dojohnso/OctoPrint-SpoolManager/releases&query=$[0].published_at)]()
![GitHub Releases (by Release)](https://img.shields.io/github/downloads/dojohnso/OctoPrint-SpoolManager/latest/total.svg)

The OctoPrint-Plugin manages all spool information and stores it in a database.

#### *NOTE: this plugin has been abandoned by the original creator and adopted here by a new maintainer*

**This plugin is under new management** and will focus on critical bug fixes to start. Please bear with me as I get acclimated to this new plugin. If you would like to support these new efforts, please consider buying me a coffee or two. Thank you!

<a href="https://www.buymeacoffee.com/djohnson.tech" target="_blank"><img src="https://djohnson.tech/images/white-button.png" width=300 /></a>

For now, I do not plan to continue any "planned features" work from the original maintainer's backlog (such as remote database support), but focus on bug fixing, code refactoring & minor UX improvements. However, all pull requests bringing work outside of my current area of interest are still welcome - I'll at least try to provide some feedback, and merge in cases where my limited Python ecosystem knowledge is sufficient to ensure plugin's healthy operation.

If you wish to support the original maintainer, or find any legacy information about the plugin, go to [OllisGit/OctoPrint-SpoolManager](https://github.com/OllisGit/OctoPrint-SpoolManager).

## Features

### Basic attributes to be captured:
- Spool basic attributes, like name,  color, material, vendor ...
- "Used length" and "Remaining weight"
- Additional notes
- CSV Export of "Legacy FilamentManager-Database" and SpoolManager
- CSV Import function

### UI features
- List all spools
- Edit single spool
- Copy single spool
- Template spool
- Sort spool table (Display name, Last/First use, Remaining)
- Force to select a spool before printing
- Warn if not enough filament is present
- Filter spool table
- Table column visibility
- Scan QR/Barcodes of a spool
- Multi Tool support
- Support for manual mid-print filament change

## Planning / next features
- [ ] External Database (IN PROGRESS)
- [ ] PrintJobHistory integration [PrintJobHistory-Plugin](https://github.com/dojohnso/OctoPrint-PrintJobHistory)
- [ ] Capture Spool-Image
- [ ] ...more planing details could be found [here](https://github.com/dojohnso/OctoPrint-SpoolManager/projects/1)

## Screenshots
<!---
![plugin-settings](screenshots/plugin-settings.png "Plugin-Settings")
![plugin-tab](screenshots/plugin-tab.png "Plugin-Tab")
-->
![listSpools-tab](screenshots/listSpools-tab.png "ListSpools-Tab")
![selectSpools-sidebar](screenshots/selectSpool-sidebar.png "SelectSpool-Sidebar")
![selectSpools-dialog](screenshots/selectSpool-dialog.png "SelectSpool-Dialog")
![editSpool-dialog](screenshots/editSpool-dialog.png "EditSpool-Dialog")
![scanSpool-dialog](screenshots/scanSpool-dialog.png "ScanSpool-Dialog")

## Setup
Install via the bundled [Plugin Manager](http://docs.octoprint.org/en/master/bundledplugins/pluginmanager.html)
or manually using this URL:

    https://github.com/dojohnso/OctoPrint-SpoolManager/releases/latest/download/main.zip

After installation, you can listen on three release channels (since 1.6.0).
What does this mean: Each channel has its own release-version and each release has a different kind of functionality and stability.

- **"Only Release"**: Only stable and tested versions will be shown in the software-update section of OctoPrint
- **"Release & Candidate"**: Beside the stable release, you can also see the "release-candidates", like '''1.7.0rc3'''.
  The rc's includde new functionalty/bugfixes and are already tested by the community.. so by YOU ;-)
- **"Release & Candidate & under Development"**: Beside stable and rc, you will be informed about development versions.
  A development version like '''1.8.0.dev5``` could include a new (experimental) feature/bugfixs, but it is not fully tested by the community

Changing between each release is done via the "Software Update section" in the settings.
![release-channels](screenshots/release-channels.png "Release channels")

Hint: "Easy-switching" is possible with OctoPrint-Version 1.8.0 (see https://github.com/OctoPrint/OctoPrint/issues/4238).
At the meantime you need to uninstall and install the version you like from the selected channel...or stay in one channel ;-)


## Versions

see [Release-Overview](https://github.com/dojohnso/OctoPrint-SpoolManager/releases/)


---
# Developer - Section

## Events
Plugin sends the following custom events to the eventbus like this:

    eventManager().fire(eventKey, eventPayload)

| EventKeys                            |
| ------------------------------------ |
| plugin_spoolmanager_spool_weight_updated_after_print |
| plugin_spoolmanager_spool_selected |
| plugin_spoolmanager_spool_deselected |
| plugin_spoolmanager_spool_added |
| plugin_spoolmanager_spool_deleted |

### MQTT

When using [MQTT Plugin](https://github.com/OctoPrint/OctoPrint-MQTT) you can subscribe to the events mentioned above using following topic pattern:
```
octoPrint/event/<event_key>
```

Topic example:
```
octoPrint/event/plugin_spoolmanager_spool_deselected
```

### Event payloads

``spool_added``
``spool_selected``

```javascript
 {
   'databaseId': 23,
   'toolId': 1,
   'spoolName':'Fancy Spool',
   'material':'ABS',
   'colorName':'dark red',
   'remainingWeight': 1234
 }
```

``spool_deselected``

```javascript
 {
   'toolId': 1
 }
```

``spool_deleted``

```javascript
 {
   'databaseId': 23
 }
```

### Octoprint plugins ecosystem

Other Plugins could listen to this events in there python-code like this:

    eventmanager.subscribe("plugin_spoolmanager_spool_selected", self._myEventListener)

or use `octoprint.plugin.EventHandlerPlugin` with something like this:

    def on_event(self, event, payload):
        if event == "plugin_spoolmanager_spool_selected":
            ## do something usefull

## 3rd party UI software used

* Color-Picker:
Pick-a-Color https://github.com/lauren/pick-a-color/
* Color Helper:
https://github.com/bgrins/TinyColor
* Select/Labels
select2 https://select2.org/
* WYSIWYG - Editor
quill https://quilljs.com/
