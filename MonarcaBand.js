
MonarcaBand_Fixed.js
// =============================================================================
// INDICADOR: Monarch Band (Versión Corregida para Liquid Charts Pro)
// Autor: Purificación Santana
// Adaptado por: Manus AI
// =============================================================================

UDI.onInit = function(data) {
    return {
        caption: "Monarch Band",
        isOverlay: true,
        plots: [
            {id: "trigger", caption: "Trigger", type: "line", color: "#00FF00", lineWidth: 2},
            {id: "average", caption: "Average", type: "line", color: "#FF0000", lineWidth: 2}
        ],
        settingsFields: [
            {id: "triggerMAType", caption: "Trigger MA Type", type: "maType", defaultValue: "SMA"},
            {id: "triggerPeriod", caption: "Trigger Period", type: "int", defaultValue: 12, min: 1},
            {id: "averageMAType", caption: "Average MA Type", type: "maType", defaultValue: "SMA"},
            {id: "averagePeriod", caption: "Average Period", type: "int", defaultValue: 12, min: 1},
            {id: "drawArrows", caption: "Draw Arrows", type: "boolean", defaultValue: true},
            {id: "arrowOffset", caption: "Arrow Offset (ticks)", type: "int", defaultValue: 10, min: 1}
        ]
    };
};

UDI.onCalculate = function(data, output) {
    // 1. Obtener parámetros
    var triggerMAType = data.parameters["triggerMAType"];
    var triggerPeriod = data.parameters["triggerPeriod"];
    var averageMAType = data.parameters["averageMAType"];
    var averagePeriod = data.parameters["averagePeriod"];

    // 2. Inicializar cálculos técnicos si no existen
    if (!UDI.$triggerMA) {
        UDI.$triggerMA = Liquid.ta.CreateMovingAverage(triggerMAType, {period: triggerPeriod});
    }
    if (!UDI.$averageMA) {
        UDI.$averageMA = Liquid.ta.CreateMovingAverage(averageMAType, {period: averagePeriod});
    }

    // 3. Cargar datos en la primera MA (Trigger)
    // El Trigger se calcula sobre el precio (usualmente el cierre)
    UDI.$triggerMA.LoadData(data);
    var triggerValues = UDI.$triggerMA.GetValues();

    // 4. Cargar datos en la segunda MA (Average)
    // El Average se calcula sobre los valores del Trigger
    // Nota: Liquid.ta permite pasar un array de valores a LoadData
    UDI.$averageMA.LoadData(triggerValues);
    var averageValues = UDI.$averageMA.GetValues();

    // 5. Asignar resultados a los plots de salida
    // Liquid Charts espera que output.values[plotIndex] sea un array
    output.values[0] = triggerValues;
    output.values[1] = averageValues;

    // 6. Lógica de flechas (Crossovers)
    if (data.parameters["drawArrows"]) {
        var lastIdx = data.valueCount - 1;
        var prevIdx = lastIdx - 1;

        if (prevIdx >= 0) {
            var tCurr = triggerValues[lastIdx];
            var aCurr = averageValues[lastIdx];
            var tPrev = triggerValues[prevIdx];
            var aPrev = averageValues[prevIdx];

            if (tCurr !== null && aCurr !== null && tPrev !== null && aPrev !== null) {
                var tickSize = data.instrument ? data.instrument.tickSize : 0.01;
                var offset = data.parameters["arrowOffset"] * tickSize;

                // Cruce Alcista
                if (tPrev <= aPrev && tCurr > aCurr) {
                    UDI.addDrawing({
                        type: "text",
                        barIndex: lastIdx,
                        price: aCurr - offset,
                        text: "▲",
                        color: "#00FF00",
                        fontSize: 20
                    });
                }
                // Cruce Bajista
                if (tPrev >= aPrev && tCurr < aCurr) {
                    UDI.addDrawing({
                        type: "text",
                        barIndex: lastIdx,
                        price: aCurr + offset,
                        text: "▼",
                        color: "#FF0000",
                        fontSize: 20
                    });
                }
            }
        }
    }
