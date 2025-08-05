// =============================================
// WEB WORKER: CALCULADORA DE DEPRECIACIÓN
// Cálculos pesados sin bloquear UI principal
// =============================================

// Función principal de cálculo de depreciación
function calculateDepreciation(asset, currentDate = new Date()) {
  try {
    const startDate = new Date(asset.start_depreciation_date);
    const monthsSinceStart = Math.max(0, 
      Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    );
    
    const depreciableValue = asset.purchase_value - (asset.residual_value || 0);
    const totalMonths = asset.useful_life_years * 12;
    const monthlyDepreciation = depreciableValue / totalMonths;
    
    const accumulatedDepreciation = Math.min(
      monthsSinceStart * monthlyDepreciation,
      depreciableValue
    );
    
    const bookValue = Math.max(
      asset.purchase_value - accumulatedDepreciation,
      asset.residual_value || 0
    );
    
    const depreciationPercentage = (accumulatedDepreciation / depreciableValue) * 100;
    const remainingMonths = Math.max(0, totalMonths - monthsSinceStart);
    const isFullyDepreciated = depreciationPercentage >= 100;
    
    return {
      id: asset.id,
      bookValue: Math.round(bookValue),
      accumulatedDepreciation: Math.round(accumulatedDepreciation),
      monthlyDepreciation: Math.round(monthlyDepreciation),
      depreciationPercentage: Math.round(depreciationPercentage * 100) / 100,
      remainingMonths,
      isFullyDepreciated,
      monthsSinceStart
    };
  } catch (error) {
    return {
      id: asset.id,
      error: error.message,
      bookValue: asset.purchase_value
    };
  }
}

// Calcular reporte completo de activos
function calculateAssetsReport(assets, currentDate = new Date()) {
  const results = assets.map(asset => calculateDepreciation(asset, currentDate));
  
  const report = {
    totalAssets: assets.length,
    totalPurchaseValue: 0,
    totalBookValue: 0,
    totalAccumulatedDepreciation: 0,
    monthlyDepreciation: 0,
    assetsNearFullDepreciation: [],
    fullyDepreciatedAssets: 0,
    activeAssets: 0,
    disposedAssets: 0,
    averageAge: 0,
    calculations: results
  };
  
  let totalAge = 0;
  
  results.forEach((calc, index) => {
    const asset = assets[index];
    
    if (!calc.error) {
      report.totalPurchaseValue += asset.purchase_value;
      report.totalBookValue += calc.bookValue;
      report.totalAccumulatedDepreciation += calc.accumulatedDepreciation;
      report.monthlyDepreciation += calc.monthlyDepreciation;
      
      if (calc.depreciationPercentage >= 90) {
        report.assetsNearFullDepreciation.push({
          ...asset,
          depreciationPercentage: calc.depreciationPercentage,
          bookValue: calc.bookValue
        });
      }
      
      if (calc.isFullyDepreciated) {
        report.fullyDepreciatedAssets++;
      }
      
      totalAge += calc.monthsSinceStart;
    }
    
    // Contar por estado
    if (asset.status === 'active') report.activeAssets++;
    else if (asset.status === 'disposed') report.disposedAssets++;
  });
  
  report.averageAge = assets.length > 0 ? Math.round(totalAge / assets.length) : 0;
  
  // Redondear valores finales
  report.totalPurchaseValue = Math.round(report.totalPurchaseValue);
  report.totalBookValue = Math.round(report.totalBookValue);
  report.totalAccumulatedDepreciation = Math.round(report.totalAccumulatedDepreciation);
  report.monthlyDepreciation = Math.round(report.monthlyDepreciation);
  
  return report;
}

// Proyecciones futuras de depreciación
function calculateDepreciationProjection(assets, monthsAhead = 12) {
  const projections = [];
  const currentDate = new Date();
  
  for (let month = 1; month <= monthsAhead; month++) {
    const futureDate = new Date(currentDate);
    futureDate.setMonth(futureDate.getMonth() + month);
    
    const report = calculateAssetsReport(assets, futureDate);
    
    projections.push({
      month,
      date: futureDate.toISOString().split('T')[0],
      totalBookValue: report.totalBookValue,
      totalAccumulatedDepreciation: report.totalAccumulatedDepreciation,
      monthlyDepreciation: report.monthlyDepreciation,
      fullyDepreciatedAssets: report.fullyDepreciatedAssets
    });
  }
  
  return projections;
}

// Análisis de rentabilidad de activos
function analyzeAssetProfitability(assets) {
  return assets.map(asset => {
    const calc = calculateDepreciation(asset);
    const ageInYears = calc.monthsSinceStart / 12;
    const depreciationPerYear = calc.monthlyDepreciation * 12;
    
    // Métricas de rentabilidad (simplificadas)
    const utilizationRate = Math.max(0, Math.min(100, (ageInYears / asset.useful_life_years) * 100));
    const valueRetention = (calc.bookValue / asset.purchase_value) * 100;
    const depreciationRate = (calc.accumulatedDepreciation / asset.purchase_value) * 100;
    
    return {
      id: asset.id,
      name: asset.name,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      valueRetention: Math.round(valueRetention * 100) / 100,
      depreciationRate: Math.round(depreciationRate * 100) / 100,
      ageInYears: Math.round(ageInYears * 100) / 100,
      bookValue: calc.bookValue,
      recommendedAction: getRecommendedAction(utilizationRate, valueRetention, ageInYears, asset.useful_life_years)
    };
  });
}

// Recomendaciones automáticas
function getRecommendedAction(utilizationRate, valueRetention, ageInYears, usefulLife) {
  if (valueRetention < 10) return 'DISPOSE'; // Dar de baja
  if (ageInYears >= usefulLife * 0.9) return 'EVALUATE'; // Evaluar reemplazo
  if (utilizationRate > 80) return 'MAINTAIN'; // Mantener
  if (utilizationRate < 50) return 'OPTIMIZE'; // Optimizar uso
  return 'MONITOR'; // Monitorear
}

// Event listener para mensajes del hilo principal
self.onmessage = function(e) {
  const { type, data, taskId } = e.data;
  
  try {
    let result;
    
    switch (type) {
      case 'CALCULATE_SINGLE_DEPRECIATION':
        result = calculateDepreciation(data.asset, data.currentDate ? new Date(data.currentDate) : undefined);
        break;
        
      case 'CALCULATE_ASSETS_REPORT':
        result = calculateAssetsReport(data.assets, data.currentDate ? new Date(data.currentDate) : undefined);
        break;
        
      case 'CALCULATE_DEPRECIATION_PROJECTION':
        result = calculateDepreciationProjection(data.assets, data.monthsAhead);
        break;
        
      case 'ANALYZE_ASSET_PROFITABILITY':
        result = analyzeAssetProfitability(data.assets);
        break;
        
      default:
        throw new Error(`Tipo de cálculo no reconocido: ${type}`);
    }
    
    // Enviar resultado exitoso
    self.postMessage({
      taskId,
      success: true,
      result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // Enviar error
    self.postMessage({
      taskId,
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Mensaje de inicialización
self.postMessage({
  type: 'WORKER_READY',
  message: 'Calculadora de depreciación inicializada',
  capabilities: [
    'CALCULATE_SINGLE_DEPRECIATION',
    'CALCULATE_ASSETS_REPORT', 
    'CALCULATE_DEPRECIATION_PROJECTION',
    'ANALYZE_ASSET_PROFITABILITY'
  ]
});