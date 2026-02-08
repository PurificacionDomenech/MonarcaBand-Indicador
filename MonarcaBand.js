// =============================================================================
// INDICADOR: Monarch Band
// Plataforma: Liquid Charts Pro
// Autor: Purificación Santana
// Versión: 1.0
// Descripción: Sistema de bandas con Trigger y Average MA con detección de cruces
// =============================================================================

var UDI = {
    // ==================== INICIALIZACIÓN ====================
    onInit: function() {
        return {
            // Nombre del indicador
            name: "Monarch Band",
            
            // Plots (líneas que se dibujan)
            plots: [
                {
                    id: "trigger",
                    name: "Trigger",
                    type: "line",
                    color: "#00FF00",
                    lineWidth: 2
                },
                {
                    id: "average",
                    name: "Average",
                    type: "line",
                    color: "#FF0000",
                    lineWidth: 2
                }
            ],
            
            // Campos de configuración
            settingsFields: [
                // PARÁMETROS
                {
                    id: "paramsGroup",
                    name: "═══ PARÁMETROS ═══",
                    type: "separator"
                },
                {
                    id: "triggerMAType",
                    name: "Trigger MA Type",
                    type: "select",
                    options: [
                        {value: "SMA", text: "SMA"},
                        {value: "EMA", text: "EMA"},
                        {value: "WMA", text: "WMA"},
                        {value: "HMA", text: "HMA"}
                    ],
                    defaultValue: "SMA"
                },
                {
                    id: "triggerPeriod",
                    name: "Trigger Period",
                    type: "integer",
                    defaultValue: 12,
                    min: 1,
                    max: 500
                },
                {
                    id: "averageMAType",
                    name: "Average MA Type",
                    type: "select",
                    options: [
                        {value: "SMA", text: "SMA"},
                        {value: "EMA", text: "EMA"},
                        {value: "WMA", text: "WMA"},
                        {value: "HMA", text: "HMA"}
                    ],
                    defaultValue: "SMA"
                },
                {
                    id: "averagePeriod",
                    name: "Average Period",
                    type: "integer",
                    defaultValue: 12,
                    min: 1,
                    max: 500
                },
                
                // OPCIONES
                {
                    id: "optionsGroup",
                    name: "═══ OPCIONES ═══",
                    type: "separator"
                },
                {
                    id: "drawArrows",
                    name: "Draw Arrows",
                    type: "boolean",
                    defaultValue: true
                },
                {
                    id: "arrowOffset",
                    name: "Arrow Offset (ticks)",
                    type: "integer",
                    defaultValue: 10,
                    min: 1,
                    max: 100
                },
                {
                    id: "colorRegion",
                    name: "Color Region",
                    type: "boolean",
                    defaultValue: true
                },
                {
                    id: "regionOpacity",
                    name: "Region Opacity %",
                    type: "integer",
                    defaultValue: 30,
                    min: 0,
                    max: 100
                },
                
                // COLORES
                {
                    id: "colorsGroup",
                    name: "═══ COLORES ═══",
                    type: "separator"
                },
                {
                    id: "triggerColor",
                    name: "Trigger Color",
                    type: "color",
                    defaultValue: "#00FF00"
                },
                {
                    id: "averageColor",
                    name: "Average Color",
                    type: "color",
                    defaultValue: "#FF0000"
                },
                {
                    id: "regionUpColor",
                    name: "Region Up Color",
                    type: "color",
                    defaultValue: "#119148"
                },
                {
                    id: "regionDownColor",
                    name: "Region Down Color",
                    type: "color",
                    defaultValue: "#870d22"
                },
                {
                    id: "arrowUpColor",
                    name: "Arrow Up Color",
                    type: "color",
                    defaultValue: "#1E6407"
                },
                {
                    id: "arrowDownColor",
                    name: "Arrow Down Color",
                    type: "color",
                    defaultValue: "#E91B1B"
                }
            ],
            
            // Se dibuja sobre el gráfico principal
            overlay: true
        };
    },
    
    // ==================== CÁLCULO ====================
    onCalculate: function(context) {
        var settings = context.settings;
        var bars = context.bars;
        var output = {};
        
        // Obtener parámetros
        var triggerMAType = settings.triggerMAType || "SMA";
        var triggerPeriod = settings.triggerPeriod || 12;
        var averageMAType = settings.averageMAType || "SMA";
        var averagePeriod = settings.averagePeriod || 12;
        
        // Verificar que hay suficientes barras
        var maxPeriod = Math.max(triggerPeriod, averagePeriod + triggerPeriod);
        if (bars.length < maxPeriod) {
            return output;
        }
        
        // Calcular Trigger MA sobre los precios de cierre
        var closePrices = bars.map(function(bar) { return bar.close; });
        var triggerValues = this.calculateMA(closePrices, triggerPeriod, triggerMAType);
        
        // Calcular Average MA sobre el Trigger
        var averageValues = this.calculateMA(triggerValues, averagePeriod, averageMAType);
        
        // Asignar valores a los plots
        output.trigger = triggerValues;
        output.average = averageValues;
        
        // Detectar cruces y crear alertas/flechas
        if (settings.drawArrows && triggerValues.length > 1 && averageValues.length > 1) {
            this.detectCrossovers(context, triggerValues, averageValues, bars);
        }
        
        // Dibujar región coloreada entre las dos líneas
        if (settings.colorRegion) {
            this.drawRegion(context, triggerValues, averageValues);
        }
        
        return output;
    },
    
    // ==================== FUNCIONES AUXILIARES ====================
    
    // Calcular Moving Average según tipo
    calculateMA: function(data, period, maType) {
        switch(maType) {
            case "SMA":
                return this.calculateSMA(data, period);
            case "EMA":
                return this.calculateEMA(data, period);
            case "WMA":
                return this.calculateWMA(data, period);
            case "HMA":
                return this.calculateHMA(data, period);
            default:
                return this.calculateSMA(data, period);
        }
    },
    
    // SMA - Simple Moving Average
    calculateSMA: function(data, period) {
        var values = [];
        
        for (var i = 0; i < data.length; i++) {
            if (i < period - 1 || data[i] === null) {
                values.push(null);
                continue;
            }
            
            var sum = 0;
            var count = 0;
            for (var j = 0; j < period; j++) {
                if (data[i - j] !== null) {
                    sum += data[i - j];
                    count++;
                }
            }
            values.push(count > 0 ? sum / count : null);
        }
        
        return values;
    },
    
    // EMA - Exponential Moving Average
    calculateEMA: function(data, period) {
        var values = [];
        var multiplier = 2 / (period + 1);
        var ema = null;
        
        for (var i = 0; i < data.length; i++) {
            if (data[i] === null) {
                values.push(null);
                continue;
            }
            
            if (ema === null) {
                // Primera EMA = valor actual
                ema = data[i];
            } else {
                // EMA = (Close - EMA(anterior)) * multiplicador + EMA(anterior)
                ema = (data[i] - ema) * multiplier + ema;
            }
            values.push(ema);
        }
        
        return values;
    },
    
    // WMA - Weighted Moving Average
    calculateWMA: function(data, period) {
        var values = [];
        var weightSum = (period * (period + 1)) / 2;
        
        for (var i = 0; i < data.length; i++) {
            if (i < period - 1 || data[i] === null) {
                values.push(null);
                continue;
            }
            
            var sum = 0;
            for (var j = 0; j < period; j++) {
                if (data[i - j] !== null) {
                    sum += data[i - j] * (period - j);
                }
            }
            values.push(sum / weightSum);
        }
        
        return values;
    },
    
    // HMA - Hull Moving Average
    calculateHMA: function(data, period) {
        var halfPeriod = Math.floor(period / 2);
        var sqrtPeriod = Math.floor(Math.sqrt(period));
        
        // WMA(2 * WMA(n/2) - WMA(n), sqrt(n))
        var wma1 = this.calculateWMA(data, halfPeriod);
        var wma2 = this.calculateWMA(data, period);
        
        // 2 * WMA(n/2) - WMA(n)
        var rawHMA = [];
        for (var i = 0; i < data.length; i++) {
            if (wma1[i] !== null && wma2[i] !== null) {
                rawHMA.push(2 * wma1[i] - wma2[i]);
            } else {
                rawHMA.push(null);
            }
        }
        
        // WMA de rawHMA con período sqrt(n)
        return this.calculateWMA(rawHMA, sqrtPeriod);
    },
    
    // Detectar cruces entre Trigger y Average
    detectCrossovers: function(context, triggerValues, averageValues, bars) {
        var lastIdx = triggerValues.length - 1;
        var prevIdx = lastIdx - 1;
        
        if (prevIdx < 0) return;
        
        var triggerCurrent = triggerValues[lastIdx];
        var averageCurrent = averageValues[lastIdx];
        var triggerPrevious = triggerValues[prevIdx];
        var averagePrevious = averageValues[prevIdx];
        
        if (triggerCurrent === null || averageCurrent === null || 
            triggerPrevious === null || averagePrevious === null) return;
        
        var settings = context.settings;
        var arrowOffset = (settings.arrowOffset || 10) * context.instrument.tickSize;
        
        // Cruce alcista (Trigger cruza ARRIBA de Average)
        var crossUp = triggerPrevious <= averagePrevious && triggerCurrent > averageCurrent;
        
        // Cruce bajista (Trigger cruza ABAJO de Average)
        var crossDown = triggerPrevious >= averagePrevious && triggerCurrent < averageCurrent;
        
        if (crossUp) {
            // Dibujar flecha hacia arriba
            var arrowPrice = averagePrevious - arrowOffset;
            context.addDrawing({
                type: "text",
                barIndex: prevIdx,
                price: arrowPrice,
                text: "▲",
                color: settings.arrowUpColor || "#1E6407",
                size: 20
            });
            
            // Notificación
            context.notify({
                title: "Monarch Band - Cruce Alcista",
                message: "Trigger cruzó por ENCIMA de Average",
                type: "success"
            });
        }
        
        if (crossDown) {
            // Dibujar flecha hacia abajo
            var arrowPrice = averagePrevious + arrowOffset;
            context.addDrawing({
                type: "text",
                barIndex: prevIdx,
                price: arrowPrice,
                text: "▼",
                color: settings.arrowDownColor || "#E91B1B",
                size: 20
            });
            
            // Notificación
            context.notify({
                title: "Monarch Band - Cruce Bajista",
                message: "Trigger cruzó por DEBAJO de Average",
                type: "warning"
            });
        }
    },
    
    // Dibujar región coloreada entre las dos líneas
    drawRegion: function(context, triggerValues, averageValues) {
        var settings = context.settings;
        var opacity = (settings.regionOpacity || 30) / 100;
        
        for (var i = 0; i < triggerValues.length; i++) {
            if (triggerValues[i] === null || averageValues[i] === null) continue;
            
            var upTrend = triggerValues[i] > averageValues[i];
            var color = upTrend ? 
                settings.regionUpColor || "#119148" : 
                settings.regionDownColor || "#870d22";
            
            // Añadir opacidad al color
            var colorWithOpacity = this.addOpacityToColor(color, opacity);
            
            context.addDrawing({
                type: "rect",
                barIndex: i,
                price1: triggerValues[i],
                price2: averageValues[i],
                color: colorWithOpacity,
                filled: true
            });
        }
    },
    
    // Añadir opacidad a un color hexadecimal
    addOpacityToColor: function(hexColor, opacity) {
        // Convertir hex a RGB
        var r = parseInt(hexColor.substring(1, 3), 16);
        var g = parseInt(hexColor.substring(3, 5), 16);
        var b = parseInt(hexColor.substring(5, 7), 16);
        
        // Retornar como rgba
        return "rgba(" + r + "," + g + "," + b + "," + opacity + ")";
    },
    
    // ==================== CAMBIOS EN PARÁMETROS ====================
    onParameterChange: function(context) {
        // Recalcular cuando cambien los parámetros
        return this.onCalculate(context);
    }
};

// Exportar el indicador
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UDI;
}