/**
 * Note: depends on sources concatenation order as defined in __init__.py & performed by Octoprint.
 * If it ever fails because of architectural change in Octoprint,
 * consider moving these "imports" to a closure ensured to run after everything loads.
 */
const MATERIALS_DENSITY_MAP = SPOOLMANAGER_CONSTANTS.MATERIALS_DENSITY_MAPPING;
const FORMAT_DATETIME_LOCAL = SPOOLMANAGER_CONSTANTS.DATES.DISPLAY_FORMATS.DATETIME_LOCAL;
const FORMAT_DATE = SPOOLMANAGER_CONSTANTS.DATES.DISPLAY_FORMATS.DATE;
const PARSE_FORMAT_DATETIME = SPOOLMANAGER_CONSTANTS.DATES.PARSE_FORMATS.DATETIME;
const PARSE_FORMAT_DATE = SPOOLMANAGER_CONSTANTS.DATES.PARSE_FORMATS.DATE;
const FILAMENT = SPOOLMANAGER_CONSTANTS.FILAMENT_STATS_CALC_MODES.FILAMENT;
const COMBINED = SPOOLMANAGER_CONSTANTS.FILAMENT_STATS_CALC_MODES.COMBINED;
const SPOOL = SPOOLMANAGER_CONSTANTS.FILAMENT_STATS_CALC_MODES.SPOOL;

const DEFAULT_DRIVEN_SCOPE = COMBINED;

// Dialog functionality
function SpoolManagerEditSpoolDialog(props) {
    const { managerViewModel } = props;

    var self = this;

    ///////////////////////////////////////////////////////////////////////////////////////////////////////// CONSTANTS
    self.scopeValues = {
        FILAMENT: FILAMENT,
        SPOOL: SPOOL,
        COMBINED: COMBINED,
    };

    var FILAMENT = self.scopeValues.FILAMENT;
    var COMBINED = self.scopeValues.COMBINED;
    var SPOOL = self.scopeValues.SPOOL;

    ///////////////////////////////////////////////////////////////////////////////////////////////////////// ITEM MODEL
    var SpoolItem = function(spoolData, editable) {
        // Init Item

        // if we use the Item for Editing we need to initialise the widget-model as well , e.g. Option-Values, Suggestion-List
        // if we just use this Item in readonly-mode we need simple ko.observer

        // FormatHelperFunction
        formatOnlyDate = function (data, dateBindingName) {
            var dateValue = data[dateBindingName];
            if (dateValue != null && dateValue() != null && dateValue() != ""){
                dateValue = dateValue();
                var result = dateValue.split(" ")[0];
                return result
            }
            return "";
        };

        this.selectedFromQRCode = ko.observable(false);
        this.selectedForTool = ko.observable(0);    // Default Tool 0
        this.isFilteredForSelection = ko.observable(false);
        // - list all attributes
        this.version = ko.observable();
        this.isSpoolVisible = ko.observable(false);
        this.hasNoData = ko.observable();
        this.databaseId = ko.observable();
        this.isTemplate = ko.observable();
        this.isActive = ko.observable();
        this.isInActive = ko.observable();
        this.displayName = ko.observable();
//        this.vendor = ko.observable();
//        this.material = ko.observable();
        this.density = ko.observable();
        this.diameter = ko.observable();
        this.diameterTolerance = ko.observable();
        this.flowRateCompensation = ko.observable();
        this.temperature = ko.observable();
        this.bedTemperature = ko.observable();
        this.enclosureTemperature = ko.observable();
        this.offsetTemperature = ko.observable();
        this.offsetBedTemperature = ko.observable();
        this.offsetEnclosureTemperature = ko.observable();
        this.colorName = ko.observable();
        this.color = ko.observable();
        this.totalWeight = ko.observable();
        this.spoolWeight = ko.observable();
        this.remainingWeight = ko.observable();
        this.remainingPercentage = ko.observable();
        this.totalLength = ko.observable();
        this.usedLength = ko.observable();
        this.usedLengthPercentage = ko.observable();
        this.remainingLength = ko.observable();
        this.remainingLengthPercentage = ko.observable();
        this.usedWeight = ko.observable();
        this.usedPercentage = ko.observable();
        this.code = ko.observable();
//        this.labels = ko.observable();
//            this.allLabels = ko.observable();
        this.noteText = ko.observable()
        this.noteDeltaFormat = ko.observable()
        this.noteHtml = ko.observable()

        this.firstUse = ko.observable();
        this.lastUse = ko.observable();
        this.firstUseKO = ko.observable();
        this.lastUseKO = ko.observable();
        this.purchasedOn = ko.observable();
        this.purchasedOnKO = ko.observable();


        this.purchasedFrom = ko.observable();
        this.cost = ko.observable();
        this.costUnit = ko.observable();

        // Assign default values for editing
        // overwrite and/or add attributes
        var vendorViewModel = self.componentFactory.createSelectWithFilter("spool-vendor-select", $('#spool-form'));
        this.vendor = vendorViewModel.selectedOption;
        this.allVendors = vendorViewModel.allOptions;

        var materialViewModel = self.componentFactory.createSelectWithFilter("spool-material-select", $('#spool-form'));
        this.material = materialViewModel.selectedOption;
        // this.allMaterials = materialViewModel.allOptions;

        // Autosuggest for "density"
        this.material.subscribe(function(newMaterial){
            if ($("#dialog_spool_edit").is(":visible")){
                if (self.spoolItemForEditing.isSpoolVisible() == true){
                    var mat = self.spoolItemForEditing.material();
                    if (mat){
                        var density = densityMap[mat.toUpperCase()]
                        if (density){
                           self.spoolItemForEditing.density(density);
                        }
                    }
                }
            }
        });

        if (editable == true){
            var colorViewModel = self.componentFactory.createColorPicker("filament-color-picker");
            this.color = colorViewModel.selectedColor;
            this.color(DEFAULT_COLOR);  // needed

            var firstUseViewModel = self.componentFactory.createDateTimePicker("firstUse-date-picker");
            var lastUseViewModel = self.componentFactory.createDateTimePicker("lastUse-date-picker");
            var purchasedOnViewModel = self.componentFactory.createDateTimePicker("purchasedOn-date-picker", false);
            this.firstUse = firstUseViewModel.currentDateTime;
            this.lastUse = lastUseViewModel.currentDateTime;
            this.purchasedOn = purchasedOnViewModel.currentDateTime;
        }
        self.labelsViewModel = self.componentFactory.createLabels("spool-labels-select", $('#spool-form'));
        this.labels   = self.labelsViewModel.selectedOptions;
        this.allLabels = self.labelsViewModel.allOptions;

        // Non-persistent fields (these exist only in this view model for weight-calculation)
        this.totalCombinedWeight = ko.observable();
        this.remainingCombinedWeight = ko.observable();
        this.drivenScope = ko.observable();
        this.drivenScopeOptions = ko.observableArray([
            {
                text: "Filament Amount",
                value: FILAMENT,
            },
            {
                text: "Spool Weight",
                value: SPOOL,
            },
            {
                text: "Combined Weight",
                value: COMBINED,
            },
        ]);

        // Fill Item with data
        this.update(spoolData);
    }

    SpoolItem.prototype.update = function (data) {
        var updateData = data || {}

        // TODO weight: renaming
        self.autoUpdateEnabled = false;

        // update latest all catalog
        if (self.catalogs != null){
            // labels
            this.allLabels.removeAll();
            ko.utils.arrayPushAll(this.allLabels, self.catalogs.labels);
            // materials
            // this.allMaterials(self.catalogs.materials);

            //vendors
            this.allVendors(self.catalogs.vendors);
        }

        this.selectedFromQRCode(updateData.selectedFromQRCode);
        this.selectedForTool(updateData.selectedForTool);
        this.hasNoData(data == null);
        this.version(updateData.version);
        this.databaseId(updateData.databaseId);
        this.isTemplate(updateData.isTemplate);
        this.isActive(updateData.isActive);
        this.isInActive(!updateData.isActive);
        this.displayName(updateData.displayName);
        this.vendor(updateData.vendor);

        this.material(updateData.material);
        this.density(updateData.density);
        this.diameter(updateData.diameter);
        this.diameterTolerance(updateData.diameterTolerance);
        // first update color code, and then update the color name
        this.color(updateData.color == null ? DEFAULT_COLOR : updateData.color);
        // if no custom color name present, use predefined name
        if (updateData.colorName == null || updateData.colorName.length == 0){
            var preDefinedColorName = tinycolor(this.color()).toName();
            if (preDefinedColorName != false){
                this.colorName(preDefinedColorName);
            }
        } else {
            this.colorName(updateData.colorName);
        }

        this.flowRateCompensation(updateData.flowRateCompensation);
        this.temperature(updateData.temperature);
        this.bedTemperature(updateData.bedTemperature);
        this.enclosureTemperature(updateData.enclosureTemperature);
        this.offsetTemperature(updateData.offsetTemperature);
        this.offsetBedTemperature(updateData.offsetBedTemperature);
        this.offsetEnclosureTemperature(updateData.offsetEnclosureTemperature);
        this.totalWeight(parseFloat(updateData.totalWeight));
        this.spoolWeight(parseFloat(updateData.spoolWeight));
        this.remainingWeight(parseFloat(updateData.remainingWeight));
        this.remainingPercentage(updateData.remainingPercentage);
        this.code(updateData.code);
        this.usedPercentage(updateData.usedPercentage);

        this.totalLength(updateData.totalLength);
        this.usedLength(updateData.usedLength);
        this.usedLengthPercentage(updateData.usedLengthPercentage);
        this.remainingLength(updateData.remainingLength);
        this.remainingLengthPercentage(updateData.remainingLengthPercentage);
        this.usedWeight(parseFloat(updateData.usedWeight));

        this.firstUse(updateData.firstUse);
        this.lastUse(updateData.lastUse);
        this.purchasedOn(updateData.purchasedOn);
        if (updateData.firstUse){
            var convertedDateTime = moment(data.firstUse, "DD.MM.YYYY HH:mm").format("YYYY-MM-DDTHH:mm")
            this.firstUseKO(convertedDateTime);
        }
        else{
            this.firstUseKO(null);
        }
        if (updateData.lastUse){
            var convertedDateTime = moment(data.lastUse, "DD.MM.YYYY HH:mm").format("YYYY-MM-DDTHH:mm")
            this.lastUseKO(convertedDateTime);
        }
        else{
            this.lastUseKO(null);
        }
        if (updateData.purchasedOn){
            var convertedDateTime = moment(data.purchasedOn, "DD.MM.YYYY").format("YYYY-MM-DD")
            this.purchasedOnKO(convertedDateTime);
        }
        else {
            this.purchasedOnKO(null);
        }

        this.purchasedFrom(updateData.purchasedFrom);

        this.cost(updateData.cost);
        this.costUnit(updateData.costUnit);

        // update label selections
        if (updateData.labels != null){
            this.labels.removeAll();
            selectedLabels = updateData.labels
            if (Array.isArray(updateData.labels) == false){
                selectedLabels = JSON.parse(updateData.labels)
            }
            ko.utils.arrayPushAll(this.labels, selectedLabels);
        }

        // assign content to the Note-Section
        // fill Obseravbles
        this.noteText(updateData.noteText);
        this.noteDeltaFormat(updateData.noteDeltaFormat);
        if (updateData.noteHtml != null){
            this.noteHtml(updateData.noteHtml);
        } else {
            // Fallback text
            this.noteHtml(updateData.noteText);
        }
        // fill editor
        if (self.noteEditor != null){
            if (updateData.noteDeltaFormat == null || updateData.noteDeltaFormat.length == 0) {
                // Fallback is text (if present), not Html
                if (updateData.noteText != null){
                    self.noteEditor.setText(updateData.noteText, 'api');
                } else {
                    self.noteEditor.setText("", 'api');
                }
            }else {
                    deltaFormat = JSON.parse(updateData.noteDeltaFormat);
                    self.noteEditor.setContents(deltaFormat, 'api');
            }
        }

        // Calculate derived fields (these exists only in this view model)
        this.totalCombinedWeight(_getValueOrZero(updateData.totalWeight) + _getValueOrZero(updateData.spoolWeight));
        this.remainingCombinedWeight(_getValueOrZero(updateData.remainingWeight) + _getValueOrZero(updateData.spoolWeight));

        self.autoUpdateEnabled = true;
    };


    ///////////////////////////////////////////////////////////////////////////////////////////////// Instance Variables
    self.spoolDialog = null;
    self.templateSpoolDialog = null;
    self.closeDialogListenerCallback = null;
    self.spoolItemForEditing = null;
    self.templateSpools = ko.observableArray([]);
    self.noteEditor = null;

    self.catalogs = null;
    self.allMaterials = ko.observableArray([]);
    self.allVendors = ko.observableArray([]);
    self.allColors = ko.observableArray([]);

    self.allToolIndices = ko.observableArray([]);

    // Knockout stuff
    this.isExistingSpool = ko.observable(false);

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////// HELPER
    const isEveryMandatoryFieldValid = () => {
        return (
            self.isDisplayNamePresent() &&
            self.isColorNamePresent() &&
            self.isTotalCombinedWeightPresent()
        );
    };

    const isEveryFilledDateFieldValid = () => {
        const firstUse = self.spoolItemForEditing.firstUseKO() || "";
        const lastUse = self.spoolItemForEditing.lastUseKO() || "";
        const purchasedOn = self.spoolItemForEditing.purchasedOnKO() || "";

        if (
            firstUse.trim().length > 0 &&
            !(moment(firstUse, FORMAT_DATETIME_LOCAL).isValid())
        ) {
            return false
        }
        if (
            lastUse.trim().length > 0 &&
            !(moment(lastUse, FORMAT_DATETIME_LOCAL).isValid())
        ) {
            return false;
        }
        if (
            purchasedOn.trim().length > 0 &&
            !(moment(purchasedOn, FORMAT_DATE).isValid())
        ) {
            return false;
        }

        return true;
    };

    self.isFormValidForSubmit = ko.pureComputed(function () {
        return (
            isEveryMandatoryFieldValid() &&
            isEveryFilledDateFieldValid()
        );
    });

    self.isDisplayNamePresent = function() {
        const displayName = self.spoolItemForEditing.displayName() || "";

        return (displayName.trim().length > 0);
    };

    self.isColorNamePresent = function() {
        const colorName = self.spoolItemForEditing.colorName() || "";

        return (colorName.trim().length > 0);
    };

    self.isTotalCombinedWeightPresent = function() {
        const totalCombinedWeight = self.spoolItemForEditing.totalCombinedWeight();

        return (String(totalCombinedWeight || "").trim().length > 0);
    };

    self._updateFilamentIcon = function(newColor) {
        const primaryColor = newColor;
        const secondaryColor = tinycolor(primaryColor).darken(12).toString();

        const $iconElement = document.querySelector("#svg-filament");

        [ ...$iconElement.querySelectorAll("rect") ].forEach(($element, elementIdx) => {
            const colorFill = elementIdx % 2 === 0 ?
                primaryColor :
                secondaryColor

            $element.setAttribute("fill", colorFill);
        });
        [ ...$iconElement.querySelectorAll("path") ].forEach(($element) => {
            $element.setAttribute("stroke", primaryColor);
        });
    };

    self._createSpoolItemForEditing = function() {
        self.spoolItemForEditing = new SpoolItem(null, {
            isEditable: true,
            catalogs: self.catalogs,
        });

        self.spoolItemForEditing.isInActive.subscribe(function(newValue){
            self.spoolItemForEditing.isActive(!newValue);
        });

        return self.spoolItemForEditing;
    };

    self._updateActiveSpoolItem = (spoolItem) => {
        const updateData = spoolItem || {};

        // TODO weight: renaming
        self.autoUpdateEnabled = false;

        self.spoolItemForEditing.update(updateData, { catalogs: self.catalogs });

        if (self.noteEditor) {
            if (
                updateData.noteDeltaFormat == null ||
                updateData.noteDeltaFormat.length == 0
            ) {
                // Fallback is text (if present), not Html
                if (updateData.noteText != null) {
                    self.noteEditor.setText(updateData.noteText, 'api');
                } else {
                    self.noteEditor.setText("", 'api');
                }
            } else {
                const deltaFormat = JSON.parse(updateData.noteDeltaFormat);

                self.noteEditor.setContents(deltaFormat, 'api');
            }
        }

        self.autoUpdateEnabled = true;
    };

    self._copySpoolItemForEditing = function(spoolItem) {
        self.isExistingSpool(false);
        let spoolItemCopy = ko.mapping.toJS(spoolItem);
        self._updateActiveSpoolItem(spoolItemCopy);
        self.spoolItemForEditing.isTemplate(false);
        // self.spoolItemForEditing.isActive(true);  is set by 'isInActive'
        self.spoolItemForEditing.isInActive(false);
        self.spoolItemForEditing.databaseId(null);
        self.spoolItemForEditing.isSpoolVisible(true);
    };

    self._cleanupSpoolItemAfterCopy = function (spoolItem) {
        const defaultExcludedFields = [
            "selectedForTool",
            "version",
            "databaseId",
            "isTemplate",
            "firstUseKO",
            "lastUseKO",
            "remainingWeight",
            "remainingPercentage",
            "usedLength",
            "usedLengthPercentage",
            "remainingLength",
            "remainingLengthPercentage",
            "usedWeight",
            "usedPercentage",
            "totalCombinedWeight",
            "remainingCombinedWeight",
        ];
        const customExcludedFields = self.pluginSettings.excludedFromTemplateCopy();

        const allFieldNames = Object.keys(spoolItem);
        for (const fieldName of allFieldNames) {
            if (
                defaultExcludedFields.includes(fieldName) ||
                customExcludedFields.includes(fieldName)
            ) {
                self.spoolItemForEditing[fieldName]("");
            }
        }
        if (customExcludedFields.includes("allNotes")) {
            if (self.noteEditor != null) {
                self.noteEditor.setText("", 'api');
            }
            // self.spoolItemForEditing["noteText"]("");
            // self.spoolItemForEditing["noteDeltaFormat"]("");
            // self.spoolItemForEditing["noteHtml"]("");
        }
    };

    self._closeSpoolEditing = (closeCallbackParams) => {
        self.spoolItemForEditing.isSpoolVisible(false);
        self.spoolDialog.modal('hide');

        self.closeDialogListenerCallback?.(closeCallbackParams);
    };

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////// PUBLIC
    self.initBinding = function(apiClient, pluginSettings, printerProfilesViewModel){
        self.autoUpdateEnabled = false;
        self.apiClient = apiClient;
        self.pluginSettings = pluginSettings;
        self.printerProfilesViewModel = printerProfilesViewModel;

        self.spoolDialog = $(SPOOLMANAGER_CONSTANTS.DOM_SELECTORS.SPOOL_DIALOG);
        self.templateSpoolDialog = $("#dialog_template_spool_selection");
        self.noteEditor = ComponentFactory.createNoteEditor('spool-note-editor');

        // initial coloring
        self._createSpoolItemForEditing();
        self._updateFilamentIcon(self.spoolItemForEditing.color());
        self.spoolItemForEditing.color.subscribe(function(newColor) {
            self._updateFilamentIcon(newColor);

            const colorName = tinycolor(newColor).toName();

            if (colorName != false){
                self.spoolItemForEditing.colorName(colorName);
            }
        });
        // ----------------- start: weight stuff
        const remainingWeightKo = self.spoolItemForEditing.remainingWeight;
        const totalWeightKo = self.spoolItemForEditing.totalWeight;
        const usedWeightKo = self.spoolItemForEditing.usedWeight;
        const remainingCombinedWeightKo = self.spoolItemForEditing.remainingCombinedWeight;
        const spoolWeightKo = self.spoolItemForEditing.spoolWeight;
        const totalCombinedWeightKo = self.spoolItemForEditing.totalCombinedWeight;
        const totalLengthKo = self.spoolItemForEditing.totalLength;
        const usedLengthKo = self.spoolItemForEditing.usedLength;
        const remainingLengthKo = self.spoolItemForEditing.remainingLength;
        const densityKo = self.spoolItemForEditing.density;
        const diameterKo = self.spoolItemForEditing.diameter;
        const usedPercentageKo = self.spoolItemForEditing.usedPercentage;
        const remainingPercentageKo = self.spoolItemForEditing.remainingPercentage;
        const usedLengthPercentageKo = self.spoolItemForEditing.usedLengthPercentage;
        const remainingLengthPercentageKo = self.spoolItemForEditing.remainingLengthPercentage;
        const drivenScopeKo = self.spoolItemForEditing.drivenScope;

        const addition = (a, b) => {
            return a + b;
        };
        const subtraction = (a, b) => {
            return a - b;
        };

        // Subscriptions for auto updates

        totalWeightKo.subscribe(function (newValue) {
            const iAmRootChange = self.amIRootChange(totalWeightKo);

            if (drivenScopeKo() === SPOOL) {
                self.updateSpoolWithScopes();
            } else {
                self.updateCombinedInitialWithScopes();
            }
            self.updateFilamentRemainingWithStates();
            self.doUnitConversion(totalWeightKo, totalLengthKo, self.convertToLength);
            self.updatePercentages(usedPercentageKo, remainingPercentageKo, totalWeightKo, usedWeightKo);
            self.resetLocksIf(iAmRootChange);
        });

        totalLengthKo.subscribe(function (newValue) {
            const iAmRootChange = self.amIRootChange(totalLengthKo);

            self.doUnitConversion(totalLengthKo, totalWeightKo, self.convertToWeight);
            self.updatePercentages(usedLengthPercentageKo, remainingLengthPercentageKo, totalLengthKo, usedLengthKo);
            self.resetLocksIf(iAmRootChange);
        });

        usedWeightKo.subscribe(function (newValue) {
            const iAmRootChange = self.amIRootChange(usedWeightKo);

            self.doUnitConversion(usedWeightKo, usedLengthKo, self.convertToLength);
            self.updateFilamentRemainingWithStates();
            self.updatePercentages(usedPercentageKo, remainingPercentageKo, totalWeightKo, usedWeightKo);
            self.resetLocksIf(iAmRootChange);
        });

        usedLengthKo.subscribe(function (newValue) {
            const iAmRootChange = self.amIRootChange(usedLengthKo);

            self.doUnitConversion(usedLengthKo, usedWeightKo, self.convertToWeight);
            self.updatePercentages(usedLengthPercentageKo, remainingLengthPercentageKo, totalLengthKo, usedLengthKo);
            self.resetLocksIf(iAmRootChange);
        });

        remainingWeightKo.subscribe(function (newValue) {
            const iAmRootChange = self.amIRootChange(remainingWeightKo);

            if (drivenScopeKo() === COMBINED) {
                self.updateCombinedRemainingWithScopes();
            }
            self.updateFilamentUsedWithStates();
            self.doUnitConversion(remainingWeightKo, remainingLengthKo, self.convertToLength);
            self.updatePercentages(usedPercentageKo, remainingPercentageKo, totalWeightKo, usedWeightKo);
            self.resetLocksIf(iAmRootChange);
        });

        remainingLengthKo.subscribe(function (newValue) {
            const iAmRootChange = self.amIRootChange(remainingLengthKo);

            self.doUnitConversion(remainingLengthKo, remainingWeightKo, self.convertToWeight);
            self.updatePercentages(usedLengthPercentageKo, remainingLengthPercentageKo, totalLengthKo, usedLengthKo);
            self.resetLocksIf(iAmRootChange);
        });

        densityKo.subscribe(function (newValue) {
            const iAmRootChange = self.amIRootChange(densityKo);

            self.convertAllUnits();
            self.resetLocksIf(iAmRootChange);
        })

        diameterKo.subscribe(function (newValue) {
            const iAmRootChange = self.amIRootChange(diameterKo);

            self.convertAllUnits();
            self.resetLocksIf(iAmRootChange);
        })

        spoolWeightKo.subscribe(function (newValue) {
            const  iAmRootChange = self.amIRootChange(spoolWeightKo);

            if (drivenScopeKo() === FILAMENT) {
                self.updateFilamentInitialWithScopes();
            } else if (drivenScopeKo() === COMBINED) {
                self.updateCombinedInitialWithScopes();
                self.updateCombinedRemainingWithScopes();
            }
            self.resetLocksIf(iAmRootChange);
        });

        totalCombinedWeightKo.subscribe(function (newValue) {
            const iAmRootChange = self.amIRootChange(totalCombinedWeightKo);

            if (drivenScopeKo() === FILAMENT) {
                self.updateFilamentInitialWithScopes();
            } else if (drivenScopeKo() === SPOOL) {
                self.updateSpoolWithScopes();
            }
            self.resetLocksIf(iAmRootChange);
        });

        remainingCombinedWeightKo.subscribe(function (newValue) {
            const iAmRootChange = self.amIRootChange(remainingCombinedWeightKo);

            if (drivenScopeKo() === FILAMENT) {
                self.updateFilamentRemainingWithScopes();
            }
            self.resetLocksIf(iAmRootChange);
        });

        // Update functions

        self.updateFilamentRemainingWithStates = function () {
            self.safeUpdate(remainingWeightKo, subtraction, [totalWeightKo, usedWeightKo]);
        };

        self.updateFilamentRemainingWithScopes = function () {
            self.safeUpdate(remainingWeightKo, subtraction, [remainingCombinedWeightKo, spoolWeightKo]);
        };

        self.updateFilamentUsedWithStates = function () {
            self.safeUpdate(usedWeightKo, subtraction, [totalWeightKo, remainingWeightKo]);
        };

        self.updateFilamentInitialWithScopes = function () {
            self.safeUpdate(totalWeightKo, subtraction, [totalCombinedWeightKo, spoolWeightKo]);
        };

        self.updateSpoolWithScopes = function () {
            self.safeUpdate(spoolWeightKo, subtraction, [totalCombinedWeightKo, totalWeightKo]);
        };

        self.updateCombinedInitialWithScopes = function () {
            self.safeUpdate(totalCombinedWeightKo, addition, [totalWeightKo, spoolWeightKo]);
        };

        self.updateCombinedRemainingWithScopes = function () {
            self.safeUpdate(remainingCombinedWeightKo, addition, [remainingWeightKo, spoolWeightKo]);
        };

        self.convertAllUnits = function () {
            self.doUnitConversion(totalWeightKo, totalLengthKo, self.convertToLength);
            self.doUnitConversion(totalLengthKo, totalWeightKo, self.convertToWeight);
            self.doUnitConversion(usedWeightKo, usedLengthKo, self.convertToLength);
            self.doUnitConversion(usedLengthKo, usedWeightKo, self.convertToWeight);
            self.doUnitConversion(remainingWeightKo, remainingLengthKo, self.convertToLength);
            self.doUnitConversion(remainingLengthKo, remainingWeightKo, self.convertToWeight);
        };

        self.doUnitConversion = function (sourceKo, targetKo, converter) {
            var source = parseFloat(sourceKo());
            if (isNaN(source) || !self.areDensityAndDiameterValid() || !self.getLock(targetKo)) {
                return;
            }
            self.getLock(sourceKo);
            targetKo(converter(source, parseFloat(densityKo()), parseFloat(diameterKo())));
        };

        self.updatePercentages = function (usedPercentageKo, remainPercentageKo, totalKo, usedKo) {
            var total = parseFloat(totalKo());
            var used = parseFloat(usedKo());
            if (isNaN(total) || total <= 0
                || isNaN(used) || used < 0 || used > total) {
                usedPercentageKo(NaN);
                remainPercentageKo(NaN);
                return;
            }
            var usedPercentage = roundWithPrecision(
                100 * used / total,
                0
            );
            usedPercentageKo(usedPercentage);
            remainPercentageKo(100 - usedPercentage);
        };

        self.safeUpdate = function (targetKo, calcFn, calcFnArguments) {
            if (!self.getLock(targetKo)) {
                return;
            }

            function getValueOrZero(x) {
                return parseFloat(x()) || 0;
            }

            targetKo(roundWithPrecision(
                calcFn.apply(null, calcFnArguments.map(getValueOrZero)),
                1
            ));
        };

        // helper functions

        self.areDensityAndDiameterValid = function () {
            var diameter = parseFloat(diameterKo());
            var density = parseFloat(densityKo());
            return (!isNaN(diameter) && diameter > 0
                && !isNaN(density) && density > 0);
        };

        self.convertToLength = function (weight, density, diameter) {
            var volume = weight / (density *  Math.pow(10, -3)); // [mm^3] = [g] / ( [g/cm^3] * 10^-3 )
            var area = (Math.PI / 4) * Math.pow(diameter, 2); // [mm^2] = pi/4 * [mm]^2
            return roundWithPrecision(volume / area, 0); // [mm] = [mm^3] / [mm^2}
        };

        self.convertToWeight = function (length, density, diameter) {
            var area = (Math.PI / 4) * Math.pow(diameter, 2); // [mm^2] = pi/4 * [mm]^2
            var volume = area * length; // [mm^3] = [mm^2] * [mm]
            return roundWithPrecision(volume * density * Math.pow(10, -3), 1); // [g] = [mm^3] * [g/cm^3] * 10^3
        };

        // lock mechanism to prevent infinite update loops

        self.locksOfInProgressUpdate = [];
        self.getLock = function (updatableEntity) {
            if (!self.autoUpdateEnabled || self.locksOfInProgressUpdate.includes(updatableEntity)) {
                return false;
            }
            self.locksOfInProgressUpdate.push(updatableEntity);
            return true;
        };
        self.resetLocksIf = function (condition) {
            if (condition) {
                self.locksOfInProgressUpdate = [];
            }
        };
        self.amIRootChange = function (source) {
            return self.locksOfInProgressUpdate.length === 0 && self.getLock(source);
        };

        // ----------------- end: weight stuff
    };

    self.afterBinding = function () {};

    // TODO: This should not be tied to SpoolManagerEditSpoolDialog
    self.createSpoolItemForTable = function(spoolData) {
        return new SpoolItem(spoolData, {
            isEditable: false,
            catalogs: self.catalogs,
        });
    };

    self.updateCatalogs = function(allCatalogs) {
        self.catalogs = allCatalogs;
        if (self.catalogs != null){
            self.allMaterials(self.catalogs["materials"]);
            self.allVendors(self.catalogs["vendors"]);
            self.allColors(self.catalogs["colors"]);
        } else {
            self.allMaterials([]);
            self.allVendors([]);
            self.allColors([]);
        }
    };

    self.updateTemplateSpools = function(templateSpoolsData) {
        if (
            !templateSpoolsData ||
            !templateSpoolsData.length
        ) {
            self.templateSpools([]);

            return;
        }

        const spoolItemsArray = ko.utils.arrayMap(templateSpoolsData, function (spoolData) {
            return self.createSpoolItemForTable(spoolData);
        });

        self.templateSpools(spoolItemsArray);
    };

    self.showDialog = function(spoolItem, params) {
        const { onCloseDialog } = params;

        self.autoUpdateEnabled = false;
        self.closeDialogListenerCallback = onCloseDialog;

        self.allToolIndices([]);

        const toolCount = self.printerProfilesViewModel.currentProfileData().extruder.count();

        for (let toolIndex = 0; toolIndex < toolCount; toolIndex++) {
            self.allToolIndices.push(toolIndex);
        }

        self._updateFilamentIcon(self.spoolItemForEditing.color());

        if (spoolItem == null) {
            self.isExistingSpool(false);

            self._updateActiveSpoolItem({});
            self.spoolItemForEditing.isInActive(false);
            // self.spoolItemForEditing.isTemplate(false);
            // self.spoolItemForEditing.isActive(true);
            // self.spoolItemForEditing.databaseId(null);
            // self.spoolItemForEditing.costUnit(self.pluginSettings.currencySymbol());
            // self.spoolItemForEditing.displayName(null);
            // self.spoolItemForEditing.totalWeight(0.0);
            // self.spoolItemForEditing.usedWeight(0.0);
            // self.spoolItemForEditing.totalLength(0);
            // self.spoolItemForEditing.usedLength(0);
            // self.spoolItemForEditing.firstUse(null);
            // self.spoolItemForEditing.firstUseKO(null);
            // self.spoolItemForEditing.lastUse(null);
            // self.spoolItemForEditing.lastUseKO(null);
            // self.spoolItemForEditing.purchasedOn(null);
            // self.spoolItemForEditing.remainingCombinedWeight(0);
            // self.spoolItemForEditing.totalCombinedWeight(0);
            
            // Force the current day on new spools
            self.spoolItemForEditing.purchasedOnKO(moment().format("YYYY-MM-DD"))
        } else {
            self.isExistingSpool(true);

            const spoolItemCopy = ko.mapping.toJS(spoolItem);

            self._updateActiveSpoolItem(spoolItemCopy);
        }
        self.spoolItemForEditing.drivenScope(DEFAULT_DRIVEN_SCOPE);
        self.spoolItemForEditing.isSpoolVisible(true);

        self.spoolDialog.modal({
            minHeight: function () {
                return Math.max($.fn.modal.defaults.maxHeight() - 180, 250);
            },
            keyboard: false,
            clickClose: true,
            showClose: false,
            backdrop: "static"
        }).css({
            width: 'auto',
            'margin-left': function () {
                return -($(this).width() / 2);
            }
        });

        self.autoUpdateEnabled = true;
    };

    self.copySpoolItem = function() {
        self._copySpoolItemForEditing(self.spoolItemForEditing);
    };

    self.copySpoolItemFromTemplate = function (spoolItem) {
        // Copy everything
        self._copySpoolItemForEditing(spoolItem);
        // Reset values that shouldn't be copied

        var defaultExcludedNumericFields = [
            "usedLength",
            "usedLengthPercentage",
            "usedWeight",
            "usedPercentage",
        ];

        var defaultExcludedFields = [
            "selectedForTool",
            "version",
            "firstUseKO",
            "lastUseKO",
            "remainingWeight",
            "remainingPercentage",
            "remainingLength",
            "remainingLengthPercentage",
            "totalCombinedWeight",
            "remainingCombinedWeight",
        ].concat(defaultExcludedNumericFields);

        var allFieldNames = Object.keys(spoolItem);
        var excludedFieldsFromSettings =
            self.pluginSettings.excludedFromTemplateCopy();
        for (const fieldName of allFieldNames) {
            if (
                excludedFieldsFromSettings.includes(fieldName) ||
                defaultExcludedFields.includes(fieldName)
            ) {
                if (defaultExcludedNumericFields.includes(fieldName)) {
                    self.spoolItemForEditing[fieldName]("0");
                } else {
                    self.spoolItemForEditing[fieldName]("");
                }
            }
        }
        if (excludedFieldsFromSettings.includes("allNotes")) {
            if (self.noteEditor != null) {
                self.noteEditor.setText("", "api");
            }
            // self.spoolItemForEditing["noteText"]("");
            // self.spoolItemForEditing["noteDeltaFormat"]("");
            // self.spoolItemForEditing["noteHtml"]("");
        }
        // Trigger the auto-calculation
        var copiedWeight = self.spoolItemForEditing["spoolWeight"]();
        self.spoolItemForEditing.spoolWeight(0);
        self.spoolItemForEditing.spoolWeight(copiedWeight);

        // close dialog
        self.templateSpoolDialog.modal("hide");
    };

    self._copySpoolItemForEditing = function (spoolItem) {
        self.isExistingSpool(false);
        let spoolItemCopy = ko.mapping.toJS(spoolItem);
        self.spoolItemForEditing.update(spoolItemCopy);
        self.spoolItemForEditing.isTemplate(false);
        // This sets isActive as well
        self.spoolItemForEditing.isInActive(false);
        self.spoolItemForEditing.databaseId(null);
        self.spoolItemForEditing.isSpoolVisible(true);
    };

    self.saveSpoolItem = function(){

        // Input validation
        var displayName = self.spoolItemForEditing.displayName();
        if (!displayName || displayName.trim().length === 0){
            alert("Displayname not entered!");
            return;
        }
        // workaround
        self.spoolItemForEditing.costUnit(self.pluginSettings.currencySymbol());

        var noteText = self.noteEditor.getText();
        var noteDeltaFormat = self.noteEditor.getContents();
        var noteHtml = self.noteEditor.getHtml();

        self.spoolItemForEditing.noteText(noteText);
        self.spoolItemForEditing.noteDeltaFormat(noteDeltaFormat);
        self.spoolItemForEditing.noteHtml(noteHtml);

        // read current note values and push to item, because there is no 2-way binding

        // self.printJobItemForEdit.noteText(noteText);
        // self.printJobItemForEdit.noteDeltaFormat(noteDeltaFormat);
        // self.printJobItemForEdit.noteHtml(noteHtml);

        const callResult = await self.apiClient.callSaveSpool(self.spoolItemForEditing);

        if (!callResult.isSuccess) {
            return managerViewModel.showPopUp(
                "error",
                'Save Spool',
                'Could not save the spool',
                true,
            );
        }

        self._closeSpoolEditing({
            shouldTableReload: true,
            event: {
                type: "save",
            },
        });
    };

    self.deleteSpoolItem = async function() {
        const hasConfirmed = confirm("Do you really want to delete this spool?");

        if (!hasConfirmed) {
            return;
        }

        const callResult = await self.apiClient.callDeleteSpool(self.spoolItemForEditing.databaseId());

        if (!callResult.isSuccess) {
            return managerViewModel.showPopUp(
                "error",
                'Delete Spool',
                'Could not delete selected spool',
                true,
            );
        }

        self._closeSpoolEditing({
            shouldTableReload: true,
        });
    };

    self.selectSpoolItemForPrintingOnTool = (params) => {
        const { toolIdx } = params;

        self._closeSpoolEditing({
            shouldTableReload: false,
            event: {
                type: "selectSpoolForPrinting",
                spoolItem: self.spoolItemForEditing,
                toolIdx,
            },
        });
    };

    self.selectAndCopyTemplateSpool = function() {
        /* needed for Filter-Search dropdown-menu */
        $('.dropdown-menu.keep-open').click(function(event) {
            event.stopPropagation();
        });

        self.templateSpoolDialog.modal({
            minHeight: function () {
                return Math.max($.fn.modal.defaults.maxHeight() - 80, 250);
            },
            show: true
        });
    };
};
