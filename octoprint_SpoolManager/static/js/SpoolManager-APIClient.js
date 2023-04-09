/**
 * @template PayloadType
 * @typedef {{
 *  isSuccess: true,
 *  payload: PayloadType,
 * }} Success
 */
/**
 * @template ErrorType
 * @typedef {{
 *  isSuccess: false,
 *  error: ErrorType,
 * }} Failure
 */

/**
 * @template PayloadType
 * @param {PayloadType} payload
 * @returns {Success<PayloadType>}
 */
const createSuccess = (payload) => {
    return {
        isSuccess: true,
        payload,
    };
};
/**
 * @template ErrorType
 * @param {ErrorType} error
 * @returns {Failure<ErrorType>}
 */
const createFailure = (error) => {
    return {
        isSuccess: false,
        error,
    };
};

const ASYNC_FN_FAIL_ERROR = "ASYNC_FN_FAILED";

/**
 * @template {unknown[]} AsyncArgs
 * @template AsyncResult
 * @param {(...args: AsyncArgs) => Promise<AsyncResult>} asyncFn
 */
const safeAsync = (asyncFn) => {
    /**
     * @param {AsyncArgs} args
     */
    const callAsync = async (...args) => {
        try {
            return await asyncFn(...args);
        } catch (error) {
            return createFailure({
                /**
                 * @type {typeof ASYNC_FN_FAIL_ERROR}
                 */
                type: ASYNC_FN_FAIL_ERROR,
                errorObj: error,
            });
        }
    };

    return callAsync;
};

function SpoolManagerAPIClient(pluginId, baseUrl) {

    this.pluginId = pluginId;
    this.baseUrl = baseUrl;

    // see https://gomakethings.com/how-to-build-a-query-string-from-an-object-with-vanilla-js/
    var _buildRequestQuery = function (data) {
        // If the data is already a string, return it as-is
        if (typeof (data) === 'string') return data;

        // Create a query array to hold the key/value pairs
        var query = [];

        // Loop through the data object
        for (var key in data) {
            if (data.hasOwnProperty(key)) {

                // Encode each key and value, concatenate them into a string, and push them to the array
                query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
            }
        }
        // Join each item in the array with a `&` and return the resulting string
        return query.join('&');

    };

    var _addApiKeyIfNecessary = function(urlContext){
        if (UI_API_KEY){
            urlContext = urlContext + "?apikey=" + UI_API_KEY;
        }
        return urlContext;
    }

    this.getExportUrl = function(exportType){
        return _addApiKeyIfNecessary("./plugin/" + this.pluginId + "/exportSpools/" + exportType);
    }

    this.getSampleCSVUrl = function(){
        return _addApiKeyIfNecessary("./plugin/" + this.pluginId + "/sampleCSV");
    }

    const buildApiUrl = (url) => {
        return `${this.baseUrl}plugin/${this.pluginId}/${url}`;
    };

    const callApi = async (url, options) => {
        const endpointUrl = buildApiUrl(url);
        const request = await fetch(endpointUrl, options);

        if (!request.ok) {
            return createFailure({
                type: "REQUEST_FAILED",
            });
        }

        const response = await ((async () => {
            if (request.headers.get('Content-Type') !== 'application/json') {
                return;
            }

            try {
                /**
                 * @type unknown
                 */
                const responseJSON = await request.json();

                return responseJSON;
            } catch (error) {
                return;
            }
        }))();

        return createSuccess({
            response,
        });
    };

    //////////////////////////////////////////////////////////////////////////////// LOAD AdditionalSettingsValues
    this.callAdditionalSettings = function (responseHandler){
        var urlToCall = this.baseUrl + "api/plugin/"+this.pluginId+"?action=additionalSettingsValues";
        $.ajax({
            url: urlToCall,
            type: "GET"
        }).always(function( data ){
            responseHandler(data)
        });
    }
    //////////////////////////////////////////////////////////////////////////////// LOAD DatabaseMetaData
    const loadDatabaseMetaData = safeAsync(async (spoolItem) => {
        return callApi(
            "loadDatabaseMetaData",
            {
                method: "GET",
            },
        );
    });
    this.loadDatabaseMetaData = loadDatabaseMetaData;

    //////////////////////////////////////////////////////////////////////////////// TEST DatabaseConnection
    this.testDatabaseConnection = function (databaseSettings, responseHandler){
        jsonPayload = ko.toJSON(databaseSettings)

        $.ajax({
            //url: API_BASEURL + "plugin/"+PLUGIN_ID+"/loadPrintJobHistory",
            url: this.baseUrl + "plugin/" + this.pluginId + "/testDatabaseConnection",
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            data: jsonPayload,
            type: "PUT"
        }).always(function( data ){
            responseHandler(data);
        });
    }

    //////////////////////////////////////////////////////////////////////////////// CONFIRM DatabaseConnectionPoblem
    this.confirmDatabaseProblemMessage = function (responseHandler){
        $.ajax({
            //url: API_BASEURL + "plugin/"+PLUGIN_ID+"/loadPrintJobHistory",
            url: this.baseUrl + "plugin/" + this.pluginId + "/confirmDatabaseProblemMessage",
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            type: "PUT"
        }).always(function( data ){
            responseHandler(data);
        });
    }


    //////////////////////////////////////////////////////////////////////////////// LOAD FILTERED/SORTED PrintJob-Items
    this.callLoadSpoolsByQuery = function (tableQuery, responseHandler){
        query = _buildRequestQuery(tableQuery);
        urlToCall = this.baseUrl + "plugin/"+this.pluginId+"/loadSpoolsByQuery?"+query;
        $.ajax({
            //url: API_BASEURL + "plugin/"+PLUGIN_ID+"/loadPrintJobHistory",
            url: urlToCall,
            type: "GET"
        }).always(function( data ){
            responseHandler(data)
            //shoud be done by the server to make sure the server is informed countdownDialog.modal('hide');
            //countdownDialog.modal('hide');
            //countdownCircle = null;
        });
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////// SAVE Spool-Item
    const callSaveSpool = safeAsync(async (spoolItem) => {
        const jsonPayload = ko.toJSON(spoolItem);

        return callApi(
            "saveSpool",
            {
                method: "PUT",
                headers: {
                    'Content-Type': "application/json; charset=UTF-8",
                },
                body: jsonPayload,
            },
        );
    });
    this.callSaveSpool = callSaveSpool;

    ////////////////////////////////////////////////////////////////////////////////////////////////// DELETE Spool-Item
    const callDeleteSpool = safeAsync(async (spoolDbId) => {
        return callApi(
            `deleteSpool/${spoolDbId}`,
            {
                method: "DELETE",
            },
        );
    });
    this.callDeleteSpool = callDeleteSpool;

    ////////////////////////////////////////////////////////////////////////////////////////////////// SELECT Spool-Item
    this.callSelectSpool = function (toolIndex, databaseId, commitCurrentSpoolValues, responseHandler){
        if (databaseId == null){
            databaseId = -1;
        }
        var payload = {
            databaseId: databaseId,
            toolIndex: toolIndex,
        }
        if (commitCurrentSpoolValues !== undefined) {
            payload.commitCurrentSpoolValues = commitCurrentSpoolValues;
        }
        $.ajax({
            url: this.baseUrl + "plugin/" + this.pluginId + "/selectSpool",
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            data: JSON.stringify(payload),
            type: "PUT"
        }).always(function( data ){
            responseHandler( data );
        });
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////// ALLOWED TO PRINT
    this.allowedToPrint = function (responseHandler){

        $.ajax({
            url: this.baseUrl + "plugin/" + this.pluginId + "/allowedToPrint",
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            type: "GET"
        }).always(function( data ){
            responseHandler(data);
        });
    }

    /////////////////////////////////////////////////////////////////////////////////////////////////// START PRINT CONFIRMED
    this.startPrintConfirmed = function (responseHandler){

        $.ajax({
            url: this.baseUrl + "plugin/" + this.pluginId + "/startPrintConfirmed",
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            type: "GET"
        }).always(function( data ){
            responseHandler(data);
        });
    }

    //////////////////////////////////////////////////////////////////////////////////////////////////// DELETE Database
    this.callDeleteDatabase = function(databaseType, databaseSettings, responseHandler){
        jsonPayload = ko.toJSON(databaseSettings)
        $.ajax({
            //url: API_BASEURL + "plugin/"+PLUGIN_ID+"/loadPrintJobHistory",
            url: this.baseUrl + "plugin/"+this.pluginId+"/deleteDatabase/"+databaseType,
            dataType: "json",
            contentType: "application/json; charset=UTF-8",
            data: jsonPayload,
            type: "POST"
        }).always(function( data ){
            responseHandler(data)
            //shoud be done by the server to make sure the server is informed countdownDialog.modal('hide');
            //countdownDialog.modal('hide');
            //countdownCircle = null;
        });
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////// DOWNLOAD Database
    this.getDownloadDatabaseUrl = function(exportType){
        return _addApiKeyIfNecessary("./plugin/" + this.pluginId + "/downloadDatabase");
    }
}
