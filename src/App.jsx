import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';

const DataAnalyzer = () => {
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [selectedColumnY, setSelectedColumnY] = useState(''); // NEW: pour scatter plot
  const [filters, setFilters] = useState([]);
  const [fileName, setFileName] = useState('');
  const [headerLines, setHeaderLines] = useState([]); // v5.5: pour export .dat
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [debugLogs, setDebugLogs] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [dateRangeEnabled, setDateRangeEnabled] = useState(false);
  const [boxplotYLimits, setBoxplotYLimits] = useState({ min: '', max: '', enabled: false });
  const [histogramXLimits, setHistogramXLimits] = useState({ min: '', max: '', enabled: false });
  const [multiYearFilter, setMultiYearFilter] = useState({ enabled: false, monthDayStart: '04-01', monthDayEnd: '06-30' }); // NEW: pour comparaison multi-année
  const [showBoxplotMedians, setShowBoxplotMedians] = useState(true); // NEW: toggle pour afficher médianes boxplot
  const [showHistogram, setShowHistogram] = useState(true); // NEW: toggle histogramme
  const [histogramUseGradient, setHistogramUseGradient] = useState(false); // Toggle gradient MSAS sur histogramme
  const [boxplotGrouping, setBoxplotGrouping] = useState('monthly'); // 'monthly', 'quarterly', 'yearly'
  const [boxplotViolinUseGradient, setBoxplotViolinUseGradient] = useState(true); // Toggle gradient couleur sur boxplot/violin
  const [ridgelineUseGradient, setRidgelineUseGradient] = useState(true); // Toggle gradient couleur sur ridgeline
  const [ridgelineSpacing, setRidgelineSpacing] = useState(60); // v6.0: Espacement entre ridgelines
  const [ridgelineHeight, setRidgelineHeight] = useState(120); // v6.0: Hauteur des ridgelines
  const [ridgelineShowEmpty, setRidgelineShowEmpty] = useState(false); // v6.0: Afficher les périodes vides
  const [showBoxplot, setShowBoxplot] = useState(true); // NEW: toggle boxplot
  const [isCalculating, setIsCalculating] = useState(false); // NEW: loading indicator
  const [scatterXLimits, setScatterXLimits] = useState({ min: '', max: '', enabled: false }); // NEW: limites X scatter
  const [scatterYLimits, setScatterYLimits] = useState({ min: '', max: '', enabled: false }); // NEW: limites Y scatter
  const [showBoxplotTrend, setShowBoxplotTrend] = useState(false); // NEW: courbe tendance boxplot
  const [scatterSwapAxes, setScatterSwapAxes] = useState(false); // NEW: inverser axes X et Y scatter
  const [scatterShowRegression, setScatterShowRegression] = useState(false); // v6.0: afficher régression linéaire
  const [scatterRegressionType, setScatterRegressionType] = useState('linear'); // v6.0: type de régression (linear | polynomial)
  const [scatterPolynomialDegree, setScatterPolynomialDegree] = useState(2); // v6.0: degré du polynôme (2-5)
  const [isDragging, setIsDragging] = useState(false); // v6.0: état du drag-and-drop
  const [psieResults, setPsieResults] = useState(null); // v7.0: résultats PSIE Sépaq
  const [showSkyTimeline, setShowSkyTimeline] = useState(false); // v5.5: chronologie
  const [boxplotType, setBoxplotType] = useState('boxplot'); // v5.5: boxplot | violin
  const [showRidgeline, setShowRidgeline] = useState(false); // v5.5: ridgeline séparé
  const [ridgelineMsasLimits, setRidgelineMsasLimits] = useState({ min: '14', max: '24', enabled: false }); // v5.5: zoom MSAS ridgeline
  const [timelineTooltip, setTimelineTooltip] = useState(null);
  
  // Refs pour chronologie
  const timelineCanvasRef = useRef(null);
  const timelineContainerRef = useRef(null);
  const ridgelineSvgRef = useRef(null); // v5.5: export PNG ridgeline

  // NEW: Fonction pour mapper une valeur (14-24) à une couleur gradient
  const getColorFromValue = (value) => {
    // Gradient EELabs haute résolution (14-24 MSAS)
    // Échantillonné tous les 0.1 MSAS pour transitions douces
    const min = 14;
    const max = 24;
    
    if (value < min) value = min;
    if (value > max) value = max;
    
    // Palette EELabs - échantillonnage 0.1 MSAS
    const colorPalette = [
      { value: 14.0, color: '#ffffff' }, { value: 14.1, color: '#ffffff' }, { value: 14.2, color: '#ffffff' },
      { value: 14.3, color: '#ffffff' }, { value: 14.4, color: '#fefcff' }, { value: 14.5, color: '#fffafe' },
      { value: 14.6, color: '#fdf6fd' }, { value: 14.7, color: '#fbeff9' }, { value: 14.8, color: '#fbedfc' },
      { value: 14.9, color: '#f9ebfa' }, { value: 15.0, color: '#f9e6fa' }, { value: 15.1, color: '#f8e6f6' },
      { value: 15.2, color: '#f6e1f0' }, { value: 15.3, color: '#f3dfeb' }, { value: 15.4, color: '#f4e0eb' },
      { value: 15.5, color: '#f3e3e6' }, { value: 15.6, color: '#f8e8eb' }, { value: 15.7, color: '#f5eae8' },
      { value: 15.8, color: '#f7ece6' }, { value: 15.9, color: '#f8efe6' }, { value: 16.0, color: '#f9f3e7' },
      { value: 16.1, color: '#faf4e4' }, { value: 16.2, color: '#f6f3e2' }, { value: 16.3, color: '#f4f5e3' },
      { value: 16.4, color: '#f3f6e3' }, { value: 16.5, color: '#f0f8e3' }, { value: 16.6, color: '#edf9e3' },
      { value: 16.7, color: '#ecfae3' }, { value: 16.8, color: '#e9fae7' }, { value: 16.9, color: '#e7fae7' },
      { value: 17.0, color: '#e7f9e9' }, { value: 17.1, color: '#e5f9ed' }, { value: 17.2, color: '#e4f8ed' },
      { value: 17.3, color: '#e4f7f1' }, { value: 17.4, color: '#e4f7f3' }, { value: 17.5, color: '#e2f4f4' },
      { value: 17.6, color: '#e1f3f7' }, { value: 17.7, color: '#e2f0f9' }, { value: 17.8, color: '#dceaf3' },
      { value: 17.9, color: '#dbe5ef' }, { value: 18.0, color: '#d8e2ee' }, { value: 18.1, color: '#d6ddef' },
      { value: 18.2, color: '#cfcfe9' }, { value: 18.3, color: '#c8b2d9' }, { value: 18.4, color: '#c595d1' },
      { value: 18.5, color: '#c27fc2' }, { value: 18.6, color: '#c271a9' }, { value: 18.7, color: '#bd6693' },
      { value: 18.8, color: '#b55678' }, { value: 18.9, color: '#b0455f' }, { value: 19.0, color: '#a63a4a' },
      { value: 19.1, color: '#9f313e' }, { value: 19.2, color: '#a03c3e' }, { value: 19.3, color: '#a54c3e' },
      { value: 19.4, color: '#ae6143' }, { value: 19.5, color: '#be7c48' }, { value: 19.6, color: '#cd9b52' },
      { value: 19.7, color: '#dcb55a' }, { value: 19.8, color: '#ecc965' }, { value: 19.9, color: '#dbca62' },
      { value: 20.0, color: '#c6c45f' }, { value: 20.1, color: '#a3b150' }, { value: 20.2, color: '#85ac4f' },
      { value: 20.3, color: '#6ba954' }, { value: 20.4, color: '#5dac5d' }, { value: 20.5, color: '#58ad74' },
      { value: 20.6, color: '#51b285' }, { value: 20.7, color: '#4eb395' }, { value: 20.8, color: '#4aafa7' },
      { value: 20.9, color: '#42a1b5' }, { value: 21.0, color: '#479dc0' }, { value: 21.1, color: '#357cb0' },
      { value: 21.2, color: '#3065ab' }, { value: 21.3, color: '#2e51a3' }, { value: 21.4, color: '#2f3c9c' },
      { value: 21.5, color: '#2c2d97' }, { value: 21.6, color: '#302291' }, { value: 21.7, color: '#3c2790' },
      { value: 21.8, color: '#452b8c' }, { value: 21.9, color: '#4e3183' }, { value: 22.0, color: '#523377' },
      { value: 22.1, color: '#513969' }, { value: 22.2, color: '#533f62' }, { value: 22.3, color: '#4e4354' },
      { value: 22.4, color: '#463f47' }, { value: 22.5, color: '#433840' }, { value: 22.6, color: '#392d2f' },
      { value: 22.7, color: '#37282b' }, { value: 22.8, color: '#312323' }, { value: 22.9, color: '#2f2121' },
      { value: 23.0, color: '#271b1b' }, { value: 23.1, color: '#211718' }, { value: 23.2, color: '#1a1112' },
      { value: 23.3, color: '#130f10' }, { value: 23.4, color: '#0b0b0b' }, { value: 23.5, color: '#090909' },
      { value: 23.6, color: '#070707' }, { value: 23.7, color: '#050505' }, { value: 23.8, color: '#000000' },
      { value: 23.9, color: '#000000' }, { value: 24.0, color: '#000000' }
    ];
    
    // Trouver les deux points de couleur à interpoler
    let lower = colorPalette[0];
    let upper = colorPalette[colorPalette.length - 1];
    
    for (let i = 0; i < colorPalette.length - 1; i++) {
      if (value >= colorPalette[i].value && value <= colorPalette[i + 1].value) {
        lower = colorPalette[i];
        upper = colorPalette[i + 1];
        break;
      }
    }
    
    // Interpoler linéairement entre les deux couleurs
    const ratio = (upper.value === lower.value) ? 0 : (value - lower.value) / (upper.value - lower.value);
    
    const lowerRGB = parseInt(lower.color.slice(1), 16);
    const upperRGB = parseInt(upper.color.slice(1), 16);
    
    const lowerR = (lowerRGB >> 16) & 255;
    const lowerG = (lowerRGB >> 8) & 255;
    const lowerB = lowerRGB & 255;
    
    const upperR = (upperRGB >> 16) & 255;
    const upperG = (upperRGB >> 8) & 255;
    const upperB = upperRGB & 255;
    
    const r = Math.round(lowerR + (upperR - lowerR) * ratio);
    const g = Math.round(lowerG + (upperG - lowerG) * ratio);
    const b = Math.round(lowerB + (upperB - lowerB) * ratio);
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  // NEW: Fonction pour calculer une régression linéaire
  const getLinearTrendLine = (points) => {
    if (points.length < 2) return null;
    
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += points[i].x;
      sumY += points[i].y;
      sumXY += points[i].x * points[i].y;
      sumX2 += points[i].x * points[i].x;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Retourner les points de début et fin de la ligne
    const x1 = points[0].x;
    const y1 = slope * x1 + intercept;
    const x2 = points[points.length - 1].x;
    const y2 = slope * x2 + intercept;
    
    return { x1, y1, x2, y2, slope, intercept };
  };

  // v5.5: Export des données filtrées au format .dat
  const exportToCSV = () => {
    if (filteredData.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const lines = [];
    
    // Ajouter les 35 lignes d'en-tête originales
    if (headerLines.length > 0) {
      lines.push(...headerLines);
    } else {
      // En-tête minimal si pas stocké
      for (let i = 0; i < 32; i++) {
        lines.push('# Header line ' + (i + 1));
      }
      lines.push('# ' + columns.join(','));
      lines.push('');
      lines.push('');
    }
    
    // Ajouter les données (point-virgules)
    filteredData.forEach(row => {
      const values = columns.map(col => {
        const value = row[col];
        if (value === null || value === undefined) return '';
        // Préserver les NaN dans l'export
        if (typeof value === 'number' && isNaN(value)) return 'NaN';
        return String(value);
      });
      lines.push(values.join(';'));
    });

    const datContent = lines.join('\n');
    const blob = new Blob([datContent], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName.replace('.dat', '')}_filtered_${new Date().toISOString().split('T')[0]}.dat`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const addLog = (message) => {
    console.log(message);
    setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // ============================================
  // HELPER FUNCTIONS pour multi-année
  // ============================================
  
  const getMonthDay = (dateStr) => {
    // Extraire mois et jour du string (YYYY-MM-DD)
    const match = dateStr.match(/^\d{4}-(\d{2})-(\d{2})/);
    if (!match) return null;
    return match[1] + '-' + match[2]; // Format "MM-DD"
  };

  // const getDayOfYear = (dateStr) => {
    // Extraire directement du string pour éviter les problèmes de timezone
    // Format attendu : "YYYY-MM-DD..." ou "YYYY-MM-DDTHH:MM:SS..."
  // const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  // if (!match) return 0;
  //   // const year = parseInt(match[1]);
  // const month = parseInt(match[2]);
  // const day = parseInt(match[3]);
  //     // Calculer le jour de l'année (1er janvier = 1)
  // const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  //     // Année bissextile
  // const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  // if (isLeap) daysInMonth[1] = 29;
  //   // let dayOfYear = day;
  // for (let i = 0; i < month - 1; i++) {
  // dayOfYear += daysInMonth[i];
  // }
  //   // return dayOfYear;
  // };

  // const parseMonthDayToDayOfYear = (monthDayStr) => {
    // Calcul manuel pour éviter les problèmes de timezone (identique à getDayOfYear)
  // const [month, day] = monthDayStr.split('-').map(Number);
  //     // Calculer le jour de l'année (1er janvier = 1)
    // Utiliser 2024 (année bissextile) comme référence pour cohérence
  // const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  //   // let dayOfYear = day;
  // for (let i = 0; i < month - 1; i++) {
  // dayOfYear += daysInMonth[i];
  // }
  //   // return dayOfYear;
  // };

  // NEW: Fonction pour obtenir la dernière année dans les données
  const getLastYearFromData = () => {
    if (data.length === 0 || columns.length < 2) return new Date().getFullYear();
    
    const dateColumnName = columns[1];
    let lastYear = 0;
    
    for (let i = 0; i < data.length; i++) {
      const dateStr = data[i][dateColumnName];
      if (dateStr) {
        const year = parseInt(dateStr.substring(0, 4));
        if (year > lastYear) lastYear = year;
      }
    }
    
    return lastYear > 0 ? lastYear : new Date().getFullYear();
  };

  // Optimized parse for large .dat files
  const handleFileUpload = (event) => {
    addLog('=== handleFileUpload called ===');
    addLog(`Event: ${event.type}`);
    
    const file = event.target.files[0];
    if (!file) {
      addLog('No file selected');
      return;
    }

    addLog(`File selected: ${file.name}, ${file.size} bytes, type: ${file.type}`);

    setFileName(file.name);
    setIsLoading(true);
    setLoadingProgress(0);

    // Use FileReader for better compatibility
    const reader = new FileReader();
    
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        const progress = Math.floor((e.loaded / e.total) * 30);
        setLoadingProgress(progress);
      }
    };
    
    reader.onerror = (e) => {
      addLog(`FileReader error: ${e}`);
      alert('Erreur lors de la lecture du fichier');
      setIsLoading(false);
    };
    
    reader.onload = async (e) => {
      try {
        addLog('File loaded, starting parsing...');
        const text = e.target.result;
        addLog(`Text length: ${text.length} characters`);
        setLoadingProgress(40);

        // Split into lines
        const lines = text.split('\n');
        addLog(`Total lines: ${lines.length}`);
        
        // Show first few lines for debugging
        addLog('First 3 lines:');
        for (let i = 0; i < Math.min(3, lines.length); i++) {
          addLog(`Line ${i + 1}: ${lines[i].substring(0, 80)}...`);
        }
        addLog(`Line 33: ${lines[32] ? lines[32].substring(0, 100) : 'EMPTY'}...`);
        addLog(`Line 36: ${lines[35] ? lines[35].substring(0, 100) : 'EMPTY'}...`);

        setLoadingProgress(50);

        // Validate file has enough lines
        if (lines.length < 36) {
          const msg = `Le fichier ne contient que ${lines.length} lignes. Format attendu: en-têtes ligne 33, données ligne 36+`;
          addLog(msg);
          alert(msg);
          setIsLoading(false);
          return;
        }

        // v5.5: Store original header lines (lines 0-34) for .dat export
        setHeaderLines(lines.slice(0, 35));

        // Get header from line 33 (array index 32)
        let headerLine = lines[32].trim();
        addLog(`Header line length: ${headerLine.length}`);
        
        if (!headerLine) {
          addLog('ERROR: Line 33 is empty');
          alert('La ligne 33 (en-têtes) est vide');
          setIsLoading(false);
          return;
        }

        // Remove leading # from header line if present
        if (headerLine.startsWith('#')) {
          headerLine = headerLine.substring(1).trim();
          addLog('Removed leading # from header line');
        }

        // Parse headers - headers use COMMA as delimiter
        const headers = headerLine
          .split(',')
          .map(h => h.trim())
          .filter(h => h.length > 0);
        
        addLog(`Parsed ${headers.length} headers: ${headers.slice(0, 5).join(' | ')}...`);
        
        if (headers.length === 0) {
          addLog('ERROR: No columns found');
          alert('Aucune colonne trouvée dans la ligne 33');
          setIsLoading(false);
          return;
        }
        
        setColumns(headers);
        setLoadingProgress(60);

        // Data uses SEMICOLON as delimiter
        const dataDelimiter = ';';
        addLog('Using semicolon delimiter for data lines');
        // Parse data starting from line 36 (array index 35)
        addLog('Starting to parse data from line 36...');
        const parsedData = [];
        let skippedLines = 0;

        for (let i = 35; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Skip empty lines
          if (!line) {
            skippedLines++;
            continue;
          }
          
          // Split line using semicolon delimiter
          const values = line.split(dataDelimiter).map(v => v.trim());
          
          // Log first data line for debugging
          if (i === 35) {
            addLog(`First data line: ${values.length} values`);
            addLog(`Expected: ${headers.length} columns`);
            addLog(`Values: ${values.slice(0, 5).join(' | ')}...`);
          }
          
          // Skip if wrong number of columns (allow ±1 for optional last column)
          if (values.length < headers.length - 1 || values.length > headers.length) {
            if (skippedLines < 3) {
              addLog(`Skipping line ${i + 1}: expected ${headers.length} columns, got ${values.length}`);
            }
            skippedLines++;
            continue;
          }
          
          // Create row object
          const row = { _id: parsedData.length };
          
          for (let j = 0; j < headers.length; j++) {
            const value = values[j] || ''; // Handle missing last column
            
            if (!value || value.length === 0) {
              row[headers[j]] = null;
              continue;
            }
            
            // Gérer explicitement "NaN" comme NaN (nombre)
            if (value === 'NaN' || value === 'nan' || value === 'NAN') {
              row[headers[j]] = NaN;
              continue;
            }
            
            // Check if it's a timestamp/date
            if (value.includes(':') || value.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(value)) {
              row[headers[j]] = value;
            } else {
              const numValue = parseFloat(value);
              row[headers[j]] = isNaN(numValue) ? value : numValue;
            }
          }
          
          parsedData.push(row);
          
          // Update progress every 5000 lines
          if (parsedData.length % 5000 === 0) {
            const progress = 60 + Math.floor(((i - 35) / (lines.length - 35)) * 35);
            setLoadingProgress(progress);
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }

        addLog('=== Parsing complete ===');
        addLog(`Total data rows: ${parsedData.length}`);
        addLog(`Skipped lines: ${skippedLines}`);
        
        if (parsedData.length === 0) {
          addLog('ERROR: No valid data found');
          alert('Aucune donnée valide trouvée à partir de la ligne 36');
          setIsLoading(false);
          return;
        }

        setData(parsedData);
        // Chercher MSAS comme colonne par défaut, sinon première colonne
        const msasColumn = headers.find(h => h.toLowerCase() === 'msas' || h.toLowerCase().includes('msas'));
        setSelectedColumn(msasColumn || headers[0]);
        setSelectedColumnY(headers.length > 1 ? headers[1] : ''); // NEW: initialiser Y
        setLoadingProgress(100);
        
        addLog('Import successful!');
        
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
        
      } catch (error) {
        addLog(`ERROR: ${error.message}`);
        addLog(`Stack: ${error.stack}`);
        alert(`Erreur: ${error.message}`);
        setIsLoading(false);
      }
    };
    
    addLog('Starting to read file as text...');
    reader.readAsText(file);
  };

  // Apply filters - optimized for large datasets
  // MODIFIÉ: ajout de la logique multi-année
  const filteredData = useMemo(() => {
    let result = data;
    
    // Apply date range filter if enabled
    if (dateRangeEnabled && dateRange.start && dateRange.end && columns.length > 1) {
      const dateColumnName = columns[1]; // 2nd column = Local Date & Time
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      result = result.filter(row => {
        const dateStr = row[dateColumnName];
        if (!dateStr) return false;
        const rowDate = new Date(dateStr);
        return rowDate >= startDate && rowDate <= endDate;
      });
    }
    
    // NEW: Apply multi-year day-of-year filter if enabled
    if (multiYearFilter.enabled && multiYearFilter.monthDayStart && multiYearFilter.monthDayEnd && columns.length > 1) {
      const dateColumnName = columns[1];
      const startMonthDay = multiYearFilter.monthDayStart; // Format "MM-DD"
      const endMonthDay = multiYearFilter.monthDayEnd;     // Format "MM-DD"
      
      result = result.filter(row => {
        const dateStr = row[dateColumnName];
        if (!dateStr) return false;
        const monthDay = getMonthDay(dateStr); // Format "MM-DD"
        if (!monthDay) return false;
        
        if (startMonthDay <= endMonthDay) {
          // Plage normale (ex: "04-01" à "06-30")
          return monthDay >= startMonthDay && monthDay <= endMonthDay;
        } else {
          // Plage qui traverse l'année (ex: "11-01" à "02-01")
          return monthDay >= startMonthDay || monthDay <= endMonthDay;
        }
      });
    }
    
    // Apply regular filters
    if (filters.length === 0) return result;
    
    // Pre-compile filter functions for better performance
    const compiledFilters = filters.map(filter => {
      const filterValue = parseFloat(filter.value);
      const isNumeric = !isNaN(filterValue);
      
      return (row) => {
        const value = row[filter.column];
        const compareValue = isNumeric ? filterValue : filter.value;

        // Exclure les lignes avec NaN ou null dans la colonne filtrée
        if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
          return false;
        }

        switch (filter.operator) {
          case '>': return value > compareValue;
          case '<': return value < compareValue;
          case '>=': return value >= compareValue;
          case '<=': return value <= compareValue;
          case '=': return value === compareValue;
          case '!=': return value !== compareValue;
          default: return true;
        }
      };
    });

    // Single pass filtering
    const filtered = [];
    for (let i = 0; i < result.length; i++) {
      let pass = true;
      for (let j = 0; j < compiledFilters.length; j++) {
        if (!compiledFilters[j](result[i])) {
          pass = false;
          break;
        }
      }
      if (pass) filtered.push(result[i]);
    }
    
    return filtered;
  }, [data, filters, dateRange, dateRangeEnabled, multiYearFilter, columns]);

  // Calculate statistics on filtered data
  const stats = useMemo(() => {
    if (!selectedColumn || filteredData.length === 0) return null;

    // Single pass to extract and validate numeric values (exclude 0)
    const values = [];
    for (let i = 0; i < filteredData.length; i++) {
      const v = filteredData[i][selectedColumn];
      if (typeof v === 'number' && !isNaN(v) && v !== 0) {
        values.push(v);
      }
    }

    if (values.length === 0) return null;

    // Calculate sum, min, max in one pass
    let sum = 0;
    let min = values[0];
    let max = values[0];
    
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      sum += v;
      if (v < min) min = v;
      if (v > max) max = v;
    }

    const mean = sum / values.length;

    // Calculate variance in second pass (unavoidable)
    let varianceSum = 0;
    for (let i = 0; i < values.length; i++) {
      const diff = values[i] - mean;
      varianceSum += diff * diff;
    }
    const stdDev = Math.sqrt(varianceSum / values.length);

    // Sort only once for median and P99
    values.sort((a, b) => a - b);

    const median = values.length % 2 === 0
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
      : values[Math.floor(values.length / 2)];

    const p99Index = Math.ceil(values.length * 0.99) - 1;
    const p99 = values[Math.max(0, Math.min(p99Index, values.length - 1))];

    return { mean, median, stdDev, p99, count: values.length, min, max };
  }, [filteredData, selectedColumn]);

  // NEW: Calculate statistics on UNFILTERED data (before filters)
  const statsBeforeFilter = useMemo(() => {
    if (!selectedColumn || data.length === 0) return null;

    const values = [];
    for (let i = 0; i < data.length; i++) {
      const v = data[i][selectedColumn];
      if (typeof v === 'number' && !isNaN(v) && v !== 0) {
        values.push(v);
      }
    }

    if (values.length === 0) return null;

    let sum = 0;
    let min = values[0];
    let max = values[0];
    
    for (let i = 0; i < values.length; i++) {
      const v = values[i];
      sum += v;
      if (v < min) min = v;
      if (v > max) max = v;
    }

    const mean = sum / values.length;

    let varianceSum = 0;
    for (let i = 0; i < values.length; i++) {
      const diff = values[i] - mean;
      varianceSum += diff * diff;
    }
    const stdDev = Math.sqrt(varianceSum / values.length);

    values.sort((a, b) => a - b);

    const median = values.length % 2 === 0
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
      : values[Math.floor(values.length / 2)];

    const p99Index = Math.ceil(values.length * 0.99) - 1;
    const p99 = values[Math.max(0, Math.min(p99Index, values.length - 1))];

    return { mean, median, stdDev, p99, count: values.length, min, max };
  }, [data, selectedColumn]);

  // NEW: Scatter plot data
  const scatterData = useMemo(() => {
    if (!selectedColumn || !selectedColumnY || filteredData.length === 0) return [];
    
    const points = [];
    
    for (let i = 0; i < filteredData.length; i++) {
      const row = filteredData[i];
      const x = row[selectedColumn];
      const y = row[selectedColumnY];
      
      if (typeof x === 'number' && !isNaN(x) && x !== 0 &&
          typeof y === 'number' && !isNaN(y) && y !== 0) {
        points.push({ 
          x: parseFloat(x.toFixed(3)), 
          y: parseFloat(y.toFixed(3)) 
        });
      }
    }
    
    // Downsampling : si trop de points, en garder seulement un sample
    // Recharts ne peut pas afficher efficacement plus de ~5000 points
    const MAX_SCATTER_POINTS = 5000;
    if (points.length > MAX_SCATTER_POINTS) {
      const sampledPoints = [];
      const step = Math.ceil(points.length / MAX_SCATTER_POINTS);
      for (let i = 0; i < points.length; i += step) {
        sampledPoints.push(points[i]);
      }
      return sampledPoints;
    }
    
    return points;
  }, [selectedColumn, selectedColumnY, filteredData]);

  // NEW: Données scatter avec option d'inversion des axes
  const scatterDataDisplay = useMemo(() => {
    if (scatterSwapAxes) {
      return scatterData.map(p => ({ x: p.y, y: p.x }));
    }
    return scatterData;
  }, [scatterData, scatterSwapAxes]);

  // v6.0: Calcul de la régression (linéaire ou polynomiale)
  const regressionStats = useMemo(() => {
    if (!scatterShowRegression || scatterDataDisplay.length < 2) return null;
    
    const n = scatterDataDisplay.length;
    
    if (scatterRegressionType === 'linear') {
      // Régression linéaire: y = mx + b
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      
      scatterDataDisplay.forEach(p => {
        sumX += p.x;
        sumY += p.y;
        sumXY += p.x * p.y;
        sumX2 += p.x * p.x;
      });
      
      const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const b = (sumY - m * sumX) / n;
      
      // Calcul de R²
      const meanY = sumY / n;
      let ssRes = 0, ssTot = 0;
      
      scatterDataDisplay.forEach(p => {
        const yPred = m * p.x + b;
        ssRes += Math.pow(p.y - yPred, 2);
        ssTot += Math.pow(p.y - meanY, 2);
      });
      
      const r2 = 1 - (ssRes / ssTot);
      const r = Math.sqrt(Math.abs(r2)) * (r2 >= 0 ? 1 : -1);
      
      return { type: 'linear', m, b, r2, r, n };
      
    } else if (scatterRegressionType === 'polynomial') {
      // Régression polynomiale: y = a₀ + a₁x + a₂x² + ... + aₙxⁿ
      const degree = scatterPolynomialDegree;
      
      // Construction de la matrice de Vandermonde et résolution par moindres carrés
      // Méthode: résoudre le système Aᵀ·A·c = Aᵀ·y
      const A = [];
      const y = [];
      
      scatterDataDisplay.forEach(p => {
        const row = [];
        for (let i = 0; i <= degree; i++) {
          row.push(Math.pow(p.x, i));
        }
        A.push(row);
        y.push(p.y);
      });
      
      // Calcul de Aᵀ·A
      const ATA = [];
      for (let i = 0; i <= degree; i++) {
        ATA[i] = [];
        for (let j = 0; j <= degree; j++) {
          let sum = 0;
          for (let k = 0; k < n; k++) {
            sum += A[k][i] * A[k][j];
          }
          ATA[i][j] = sum;
        }
      }
      
      // Calcul de Aᵀ·y
      const ATy = [];
      for (let i = 0; i <= degree; i++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += A[k][i] * y[k];
        }
        ATy[i] = sum;
      }
      
      // Résolution du système linéaire par élimination de Gauss
      const coeffs = gaussianElimination(ATA, ATy);
      
      // Calcul de R²
      const meanY = y.reduce((a, b) => a + b, 0) / n;
      let ssRes = 0, ssTot = 0;
      
      scatterDataDisplay.forEach(p => {
        let yPred = 0;
        for (let i = 0; i <= degree; i++) {
          yPred += coeffs[i] * Math.pow(p.x, i);
        }
        ssRes += Math.pow(p.y - yPred, 2);
        ssTot += Math.pow(p.y - meanY, 2);
      });
      
      const r2 = 1 - (ssRes / ssTot);
      
      return { type: 'polynomial', coeffs, degree, r2, n };
    }
    
    return null;
  }, [scatterDataDisplay, scatterShowRegression, scatterRegressionType, scatterPolynomialDegree]);
  
  // Fonction d'élimination de Gauss pour résoudre un système linéaire
  function gaussianElimination(A, b) {
    const n = b.length;
    const Ab = A.map((row, i) => [...row, b[i]]);
    
    // Élimination
    for (let i = 0; i < n; i++) {
      // Trouver le pivot
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(Ab[k][i]) > Math.abs(Ab[maxRow][i])) {
          maxRow = k;
        }
      }
      [Ab[i], Ab[maxRow]] = [Ab[maxRow], Ab[i]];
      
      // Rendre tous les éléments sous le pivot égaux à 0
      for (let k = i + 1; k < n; k++) {
        const factor = Ab[k][i] / Ab[i][i];
        for (let j = i; j <= n; j++) {
          Ab[k][j] -= factor * Ab[i][j];
        }
      }
    }
    
    // Substitution arrière
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      x[i] = Ab[i][n];
      for (let j = i + 1; j < n; j++) {
        x[i] -= Ab[i][j] * x[j];
      }
      x[i] /= Ab[i][i];
    }
    
    return x;
  }

  // v6.0: Données de la ligne/courbe de régression
  const regressionLine = useMemo(() => {
    if (!regressionStats) return [];
    
    const xValues = scatterDataDisplay.map(p => p.x);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    
    if (regressionStats.type === 'linear') {
      // Ligne droite (2 points suffisent)
      const { m, b } = regressionStats;
      return [
        { x: xMin, y: m * xMin + b },
        { x: xMax, y: m * xMax + b }
      ];
    } else if (regressionStats.type === 'polynomial') {
      // Courbe polynomiale (50 points pour lisser)
      const { coeffs, degree } = regressionStats;
      const points = [];
      const numPoints = 50;
      
      for (let i = 0; i <= numPoints; i++) {
        const x = xMin + (xMax - xMin) * (i / numPoints);
        let y = 0;
        for (let j = 0; j <= degree; j++) {
          y += coeffs[j] * Math.pow(x, j);
        }
        points.push({ x, y });
      }
      
      return points;
    }
    
    return [];
  }, [regressionStats, scatterDataDisplay]);

  // v5.5: Chronologie - Heure locale, nuits continues (17h J → 7h J+1)
  const skyTimelineData = useMemo(() => {
    if (!showSkyTimeline || filteredData.length === 0 || columns.length < 2) return null;
    
    const dateColumnName = columns[1];
    const msasColumn = columns.find(h => h.toLowerCase() === 'msas' || h.toLowerCase().includes('msas'));
    if (!msasColumn) return null;
    
    const nightsMap = new Map();
    let minDate = null;
    let maxDate = null;
    
    for (let i = 0; i < filteredData.length; i++) {
      const row = filteredData[i];
      const dateStr = row[dateColumnName];
      const msas = row[msasColumn];
      
      if (!dateStr || typeof msas !== 'number' || isNaN(msas)) continue;
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) continue;
      
      const hour = date.getHours();
      const minute = date.getMinutes();
      
      if (hour >= 7 && hour < 17) continue; // Ignorer 7h-17h
      
      let nightDate, relativeMinutes;
      
      // Extraire la date locale directement du string (YYYY-MM-DD)
      const localDateMatch = dateStr.match(/^(\d{4}-\d{2}-\d{2})/);
      if (!localDateMatch) continue;
      const localDateStr = localDateMatch[1]; // "2024-01-01"
      
      if (hour >= 17) {
        // 17h-23h59 : même date que l'observation
        nightDate = localDateStr;
        relativeMinutes = (hour - 17) * 60 + minute; // 17h=0, 23h59=419
      } else if (hour < 7) {
        // 0h-6h59 : nuit du jour précédent
        const [year, month, day] = localDateStr.split('-').map(Number);
        const prevDay = new Date(year, month - 1, day - 1);
        const prevYear = prevDay.getFullYear();
        const prevMonth = String(prevDay.getMonth() + 1).padStart(2, '0');
        const prevDayNum = String(prevDay.getDate()).padStart(2, '0');
        nightDate = `${prevYear}-${prevMonth}-${prevDayNum}`;
        relativeMinutes = (hour + 7) * 60 + minute; // 0h=420, 6h59=839
      } else {
        continue; // 7h-16h59 ignoré
      }
      
      const nightDateObj = new Date(nightDate);
      if (!minDate || nightDateObj < minDate) minDate = nightDateObj;
      if (!maxDate || nightDateObj > maxDate) maxDate = nightDateObj;
      
      if (relativeMinutes < 0 || relativeMinutes > 840) continue;
      
      if (!nightsMap.has(nightDate)) nightsMap.set(nightDate, new Map());
      nightsMap.get(nightDate).set(relativeMinutes, msas);
    }
    
    const allNights = [];
    if (minDate && maxDate) {
      const currentDate = new Date(minDate);
      while (currentDate <= maxDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        allNights.push(dateKey);
        if (!nightsMap.has(dateKey)) nightsMap.set(dateKey, new Map());
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    return { nightsMap, sortedNights: allNights, nightCount: allNights.length };
  }, [showSkyTimeline, filteredData, columns]);

  // useEffect pour dessiner canvas
  useEffect(() => {
    if (!showSkyTimeline || !skyTimelineData || !timelineCanvasRef.current) return;
    
    const canvas = timelineCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const { nightsMap, sortedNights } = skyTimelineData;
    
    const cellWidth = 5, cellHeight = 1, totalMinutes = 841, leftMargin = 50, topMargin = 60;
    
    canvas.width = leftMargin + sortedNights.length * cellWidth;
    canvas.height = topMargin + totalMinutes * cellHeight;
    
    ctx.fillStyle = 'rgba(20, 25, 45, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(50, 55, 70, 0.2)';
    ctx.fillRect(leftMargin, topMargin, sortedNights.length * cellWidth, totalMinutes * cellHeight);
    
    // Données
    sortedNights.forEach((nightDate, nightIdx) => {
      nightsMap.get(nightDate).forEach((msas, relativeMinutes) => {
        ctx.fillStyle = getColorFromValue(msas);
        ctx.fillRect(leftMargin + nightIdx * cellWidth, topMargin + (totalMinutes - relativeMinutes) * cellHeight, cellWidth, cellHeight);
      });
    });
    
    // Lignes et labels heures
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.3)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(224, 230, 237, 0.9)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let h = 17; h <= 23; h++) {
      const y = topMargin + (totalMinutes - (h - 17) * 60) * cellHeight;
      ctx.beginPath();
      ctx.moveTo(leftMargin, y);
      ctx.lineTo(leftMargin + sortedNights.length * cellWidth, y);
      ctx.stroke();
      ctx.fillText(`${h}h`, leftMargin - 5, y);
    }
    
    for (let h = 0; h <= 7; h++) {
      const y = topMargin + (totalMinutes - (h + 7) * 60) * cellHeight;
      ctx.beginPath();
      ctx.moveTo(leftMargin, y);
      ctx.lineTo(leftMargin + sortedNights.length * cellWidth, y);
      ctx.stroke();
      ctx.fillText(`${h}h`, leftMargin - 5, y);
    }
    
    // Dates
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    sortedNights.forEach((nightDate, idx) => {
      const dateObj = new Date(nightDate);
      if (dateObj.getDate() === 1) {
        const x = leftMargin + idx * cellWidth;
        ctx.strokeStyle = 'rgba(0, 255, 170, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, topMargin);
        ctx.lineTo(x, topMargin + totalMinutes * cellHeight);
        ctx.stroke();
        
        const label = `${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
        ctx.fillStyle = 'rgba(224, 230, 237, 0.9)';
        ctx.save();
        ctx.translate(x + 3, topMargin - 10);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
    });
    
    // Ligne minuit
    const midnightY = topMargin + (totalMinutes - 420) * cellHeight;
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(leftMargin, midnightY);
    ctx.lineTo(leftMargin + sortedNights.length * cellWidth, midnightY);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 200, 100, 0.9)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('0h', leftMargin - 5, midnightY);
    
  }, [showSkyTimeline, skyTimelineData]);

  // Prepare histogram data - optimized for large datasets
  const histogramData = useMemo(() => {
    if (!selectedColumn || filteredData.length === 0) return [];

    // Extract values efficiently (exclude 0)
    let values = [];
    for (let i = 0; i < filteredData.length; i++) {
      const v = filteredData[i][selectedColumn];
      if (typeof v === 'number' && !isNaN(v) && v !== 0) {
        values.push(v);
      }
    }

    if (values.length === 0) return [];

    // Determine min/max based on manual limits or data
    let min, max;
    let useManualLimits = false;
    
    if (histogramXLimits.enabled && histogramXLimits.min !== '' && histogramXLimits.max !== '') {
      const parsedMin = parseFloat(histogramXLimits.min);
      const parsedMax = parseFloat(histogramXLimits.max);
      
      // Validation: vérifier que les limites sont valides et que min < max
      if (!isNaN(parsedMin) && !isNaN(parsedMax) && parsedMin < parsedMax) {
        min = parsedMin;
        max = parsedMax;
        useManualLimits = true;
        // Filter values to only include those within limits
        values = values.filter(v => v >= min && v <= max);
        // Si aucune valeur ne correspond, continuer avec auto-limites
        if (values.length === 0) {
          useManualLimits = false;
        }
      }
    }
    
    // Si pas de limites manuelles valides, utiliser auto
    if (!useManualLimits) {
      // Find min/max in single pass
      min = values[0];
      max = values[0];
      for (let i = 1; i < values.length; i++) {
        if (values[i] < min) min = values[i];
        if (values[i] > max) max = values[i];
      }
    }

    // Prevent division by zero
    if (min === max) {
      max = min + 1;
    }

    // Limit bins to prevent rendering issues
    const binCount = Math.min(50, Math.max(10, Math.ceil(Math.sqrt(values.length))));
    const binSize = (max - min) / binCount;

    // Initialize bins
    const bins = new Array(binCount);
    for (let i = 0; i < binCount; i++) {
      bins[i] = {
        range: (min + i * binSize).toFixed(2),
        count: 0,
        binStart: min + i * binSize,
        binEnd: min + (i + 1) * binSize
      };
    }

    // Count values in bins - single pass
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      // Skip values outside the range (shouldn't happen but safety check)
      if (value < min || value > max) continue;
      const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
      if (binIndex >= 0) {
        bins[binIndex].count++;
      }
    }

    return bins;
  }, [filteredData, selectedColumn, histogramXLimits]);

  // Prepare boxplot data grouped by month/quarter/year
  const boxplotData = useMemo(() => {
    if (!selectedColumn || filteredData.length === 0 || columns.length < 2) return [];
    
    const dateColumnName = columns[1]; // 2nd column = Local Date & Time
    
    // Helper function to get period key based on grouping mode
    const getPeriodKey = (dateStr) => {
      if (!dateStr || dateStr.length < 10) return null;
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(5, 7);
      
      if (boxplotGrouping === 'yearly') {
        return year;
      } else if (boxplotGrouping === 'quarterly') {
        const monthNum = parseInt(month, 10);
        const quarter = Math.ceil(monthNum / 3);
        return `${year}-Q${quarter}`;
      } else { // monthly
        return dateStr.substring(0, 7); // YYYY-MM
      }
    };
    
    // Helper function to get next period
    const getNextPeriod = (current) => {
      if (boxplotGrouping === 'yearly') {
        const year = parseInt(current, 10);
        return String(year + 1);
      } else if (boxplotGrouping === 'quarterly') {
        const [year, q] = current.split('-Q');
        const yearNum = parseInt(year, 10);
        const quarterNum = parseInt(q, 10);
        if (quarterNum === 4) {
          return `${yearNum + 1}-Q1`;
        } else {
          return `${yearNum}-Q${quarterNum + 1}`;
        }
      } else { // monthly
        const [year, month] = current.split('-').map(Number);
        const nextDate = new Date(year, month, 1);
        const nextMonth = nextDate.getMonth() + 1;
        const nextYear = nextDate.getFullYear();
        return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
      }
    };
    
    // Group data by period
    const periodData = {};
    let minPeriod = null;
    let maxPeriod = null;
    
    for (let i = 0; i < filteredData.length; i++) {
      const row = filteredData[i];
      const value = row[selectedColumn];
      const dateStr = row[dateColumnName];
      
      // Exclude 0 values
      if (typeof value !== 'number' || isNaN(value) || value === 0 || !dateStr) continue;
      
      // Get period key based on grouping mode
      const periodKey = getPeriodKey(dateStr);
      if (!periodKey) continue;
      
      if (!periodData[periodKey]) {
        periodData[periodKey] = [];
      }
      periodData[periodKey].push(value);
      
      // Track min/max periods
      if (!minPeriod || periodKey < minPeriod) minPeriod = periodKey;
      if (!maxPeriod || periodKey > maxPeriod) maxPeriod = periodKey;
    }
    
    if (!minPeriod || !maxPeriod) return [];
    
    // Create complete list of periods between minPeriod and maxPeriod
    const boxplots = [];
    let currentPeriod = minPeriod;
    
    while (currentPeriod <= maxPeriod) {
      const values = periodData[currentPeriod];
      
      if (values && values.length > 0) {
        // Calculate boxplot stats for this period
        values.sort((a, b) => a - b);
        const n = values.length;
        
        const min = values[0];
        const max = values[n - 1];
        const median = n % 2 === 0 
          ? (values[n / 2 - 1] + values[n / 2]) / 2 
          : values[Math.floor(n / 2)];
        const q1 = values[Math.floor(n * 0.25)];
        const q3 = values[Math.floor(n * 0.75)];
        const p5 = values[Math.floor(n * 0.05)];
        const p95 = values[Math.floor(n * 0.95)];
        
        boxplots.push({
          month: currentPeriod,
          min, q1, median, q3, max, p5, p95,
          count: n,
          isEmpty: false
        });
      } else {
        // Add empty placeholder for missing period
        boxplots.push({
          month: currentPeriod,
          isEmpty: true,
          count: 0
        });
      }
      
      // Move to next period
      currentPeriod = getNextPeriod(currentPeriod);
    }
    
    return boxplots;
  }, [filteredData, selectedColumn, columns, boxplotGrouping]);

  // v5.5 — KDE pour violin & ridgeline
  const distributionData = useMemo(() => {
    if (!selectedColumn || filteredData.length === 0 || columns.length < 2) return [];
    const dateCol = columns[1];
    
    // Helper function to get period key (same as boxplotData)
    const getPeriodKey = (dateStr) => {
      if (!dateStr || dateStr.length < 10) return null;
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(5, 7);
      
      if (boxplotGrouping === 'yearly') {
        return year;
      } else if (boxplotGrouping === 'quarterly') {
        const monthNum = parseInt(month, 10);
        const quarter = Math.ceil(monthNum / 3);
        return `${year}-Q${quarter}`;
      } else { // monthly
        return dateStr.substring(0, 7); // YYYY-MM
      }
    };
    
    const periodData = {};
    let minP = null, maxP = null;

    for (let i = 0; i < filteredData.length; i++) {
      const row = filteredData[i];
      const val = row[selectedColumn];
      const ds  = row[dateCol];
      if (typeof val !== 'number' || isNaN(val) || val === 0 || !ds) continue;
      const pk = getPeriodKey(ds);
      if (!pk) continue;
      if (!periodData[pk]) periodData[pk] = [];
      periodData[pk].push(val);
      if (!minP || pk < minP) minP = pk;
      if (!maxP || pk > maxP) maxP = pk;
    }
    if (!minP || !maxP) return [];

    const kde = (values, n = 60) => {
      values.sort((a, b) => a - b);
      const lo = values[0], hi = values[values.length - 1];
      const range = hi - lo || 1;
      const bw = range / 20;
      const pts = [];
      for (let i = 0; i < n; i++) {
        const x = lo + (i / (n - 1)) * range;
        let d = 0;
        for (const v of values) {
          const z = (x - v) / bw;
          d += Math.exp(-0.5 * z * z);
        }
        pts.push({ x, density: d / (values.length * bw * Math.sqrt(2 * Math.PI)) });
      }
      const mx = Math.max(...pts.map(p => p.density));
      const raw = pts.map(p => ({ x: p.x, density: p.density })); // brut pour ridgeline
      if (mx > 0) pts.forEach(p => { p.density /= mx; }); // normalisé pour violin
      return { normalized: pts, raw };
    };

    const result = [];
    let cur = minP;
    while (cur <= maxP) {
      const vals = periodData[cur];
      if (vals && vals.length > 0) {
        const sorted = [...vals].sort((a, b) => a - b);
        const nn = sorted.length;
        const kdeResult = kde(vals);
        result.push({
          month: cur,
          density: kdeResult.normalized,
          rawDensity: kdeResult.raw,
          values: sorted,
          median: nn % 2 === 0 ? (sorted[nn/2-1] + sorted[nn/2]) / 2 : sorted[Math.floor(nn/2)],
          q1: sorted[Math.floor(nn * 0.25)],
          q3: sorted[Math.floor(nn * 0.75)],
          isEmpty: false
        });
      } else {
        result.push({ month: cur, isEmpty: true });
      }
      // Move to next period
      if (boxplotGrouping === 'yearly') {
        const year = parseInt(cur, 10);
        cur = String(year + 1);
      } else if (boxplotGrouping === 'quarterly') {
        const [year, q] = cur.split('-Q');
        const yearNum = parseInt(year, 10);
        const quarterNum = parseInt(q, 10);
        if (quarterNum === 4) {
          cur = `${yearNum + 1}-Q1`;
        } else {
          cur = `${yearNum}-Q${quarterNum + 1}`;
        }
      } else { // monthly
        const [y, m] = cur.split('-').map(Number);
        const nd = new Date(y, m, 1);
        cur = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}`;
      }
    }
    return result;
  }, [filteredData, selectedColumn, columns, boxplotGrouping]);

  // NEW: Yearly comparison data (for multi-year analysis)
  const yearlyComparison = useMemo(() => {
    if (!multiYearFilter.enabled || !selectedColumn || data.length === 0 || columns.length < 2) return [];
    
    const dateColumnName = columns[1];
    const startMonthDay = multiYearFilter.monthDayStart; // Format "MM-DD"
    const endMonthDay = multiYearFilter.monthDayEnd;     // Format "MM-DD"
    
    // Group by year
    const yearlyData = {};
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const dateStr = row[dateColumnName];
      const value = row[selectedColumn];
      
      if (!dateStr || typeof value !== 'number' || isNaN(value) || value === 0) continue;
      
      const year = dateStr.substring(0, 4);
      const monthDay = getMonthDay(dateStr);
      if (!monthDay) continue;
      
      // Check if day is in range
      let inRange = false;
      if (startMonthDay <= endMonthDay) {
        inRange = monthDay >= startMonthDay && monthDay <= endMonthDay;
      } else {
        inRange = monthDay >= startMonthDay || monthDay <= endMonthDay;
      }
      
      if (!inRange) continue;
      
      // Apply regular filters (AND logic with multi-year)
      let passFilters = true;
      for (const filter of filters) {
        const filterValue = parseFloat(filter.value);
        const isNumeric = !isNaN(filterValue);
        const fv = row[filter.column];
        const compareValue = isNumeric ? filterValue : filter.value;
        
        let conditionPass = false;
        switch (filter.operator) {
          case '>': conditionPass = fv > compareValue; break;
          case '<': conditionPass = fv < compareValue; break;
          case '>=': conditionPass = fv >= compareValue; break;
          case '<=': conditionPass = fv <= compareValue; break;
          case '=': conditionPass = fv === compareValue; break;
          case '!=': conditionPass = fv !== compareValue; break;
          default: conditionPass = true;
        }
        
        if (!conditionPass) {
          passFilters = false;
          break;
        }
      }
      
      if (!passFilters) continue;
      
      if (!yearlyData[year]) yearlyData[year] = [];
      yearlyData[year].push(value);
    }
    
    // Calculate stats for each year
    const result = [];
    const sortedYears = Object.keys(yearlyData).sort();
    
    for (const year of sortedYears) {
      const values = yearlyData[year].sort((a, b) => a - b);
      const n = values.length;
      
      if (n === 0) continue;
      
      let sum = 0;
      let min = values[0];
      let max = values[0];
      
      for (let i = 0; i < n; i++) {
        sum += values[i];
        if (values[i] < min) min = values[i];
        if (values[i] > max) max = values[i];
      }
      
      const mean = sum / n;
      
      let varianceSum = 0;
      for (let i = 0; i < n; i++) {
        const diff = values[i] - mean;
        varianceSum += diff * diff;
      }
      const stdDev = Math.sqrt(varianceSum / n);
      
      const median = n % 2 === 0
        ? (values[n / 2 - 1] + values[n / 2]) / 2
        : values[Math.floor(n / 2)];
      
      const p99Index = Math.ceil(n * 0.99) - 1;
      const p99 = values[Math.max(0, Math.min(p99Index, n - 1))];
      
      result.push({ year, mean, median, stdDev, p99, min, max, count: n });
    }
    
    return result;
  }, [data, selectedColumn, filters, multiYearFilter, columns]);

  const addFilter = () => {
    setFilters([...filters, { column: columns[0] || '', operator: '>', value: '' }]);
  };

  const removeFilter = (index) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index, field, value) => {
    const newFilters = [...filters];
    newFilters[index][field] = value;
    setFilters(newFilters);
  };

  const addQuickFilter = (column, operator, value) => {
    const exists = filters.some(f => f.column === column && f.operator === operator && f.value === value);
    if (!exists) {
      setFilters([...filters, { column, operator, value }]);
    }
  };

  // Fonction pour calculer le nombre de lignes après un filtre spécifique (cumulatif)
  const getLinesAfterFilter = (filterIndex) => {
    let result = data;
    
    // Appliquer dateRange si activé
    if (dateRangeEnabled && dateRange.start && dateRange.end && columns.length > 1) {
      const dateColumnName = columns[1];
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      result = result.filter(row => {
        const dateStr = row[dateColumnName];
        if (!dateStr) return false;
        const rowDate = new Date(dateStr);
        return rowDate >= startDate && rowDate <= endDate;
      });
    }
    
    // Appliquer multiYear si activé
    if (multiYearFilter.enabled && multiYearFilter.monthDayStart && multiYearFilter.monthDayEnd && columns.length > 1) {
      const dateColumnName = columns[1];
      const startMonthDay = multiYearFilter.monthDayStart; // Format "MM-DD"
      const endMonthDay = multiYearFilter.monthDayEnd;     // Format "MM-DD"
      result = result.filter(row => {
        const dateStr = row[dateColumnName];
        if (!dateStr) return false;
        const monthDay = getMonthDay(dateStr);
        if (!monthDay) return false;
        if (startMonthDay <= endMonthDay) {
          return monthDay >= startMonthDay && monthDay <= endMonthDay;
        } else {
          return monthDay >= startMonthDay || monthDay <= endMonthDay;
        }
      });
    }
    
    // Appliquer les filtres réguliers jusqu'à filterIndex (inclus)
    for (let fi = 0; fi <= filterIndex; fi++) {
      const filter = filters[fi];
      const filterValue = parseFloat(filter.value);
      const isNumeric = !isNaN(filterValue);
      
      result = result.filter(row => {
        const value = row[filter.column];
        const compareValue = isNumeric ? filterValue : filter.value;
        
        // Exclure les lignes avec NaN ou null dans la colonne filtrée
        if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
          return false;
        }

        switch (filter.operator) {
          case '>': return value > compareValue;
          case '<': return value < compareValue;
          case '>=': return value >= compareValue;
          case '<=': return value <= compareValue;
          case '=': return value === compareValue;
          case '!=': return value !== compareValue;
          default: return true;
        }
      });
    }
    
    return result.length;
  };

  // Quick date filters
  const applyDateQuickFilter = (name) => {
    const year = getLastYearFromData();
    
    switch(name) {
      case 'all':
        setDateRange({ start: '', end: '' });
        setDateRangeEnabled(false);
        break;
      case 'fullyear':
        setDateRange({ start: `${year}-01-01T00:00`, end: `${year}-12-31T23:59` });
        setDateRangeEnabled(true);
        break;
      case 'winter':
        setDateRange({ start: `${year}-01-01T00:00`, end: `${year}-03-15T23:59` });
        setDateRangeEnabled(true);
        break;
      case 'spring':
        setDateRange({ start: `${year}-04-01T00:00`, end: `${year}-06-30T23:59` });
        setDateRangeEnabled(true);
        break;
      case 'summer':
        setDateRange({ start: `${year}-04-01T00:00`, end: `${year}-09-30T23:59` });
        setDateRangeEnabled(true);
        break;
      default:
        break;
    }
  };

  // Detecter quand les filtres changent ET quand les graphiques se recalculent
  React.useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => setIsCalculating(false), 300);
    return () => clearTimeout(timer);
  }, [filters, dateRangeEnabled, dateRange, multiYearFilter, histogramData, boxplotData, scatterData]);

  // v7.1: Fonction de calcul PSIE Sépaq (corrigée - par année)
  const calculatePSIE = () => {
    if (data.length === 0) {
      alert('Veuillez d\'abord charger un fichier .dat');
      return;
    }

    addLog('Calcul PSIE Sépaq démarré (v7.1)');
    
    // Identifier le photomètre
    const photometre = fileName.replace('.dat', '').replace('.txt', '');
    
    // Fonction helper pour calculer les stats
    const calculateStats = (subset) => {
      if (subset.length === 0) {
        return { count: 0, mean: 0, median: 0, p99: 0, sd: 0 };
      }
      
      const values = subset.map(d => d.MSAS).filter(v => v != null && !isNaN(v)).sort((a, b) => a - b);
      const n = values.length;
      
      if (n === 0) {
        return { count: 0, mean: 0, median: 0, p99: 0, sd: 0 };
      }
      
      const mean = values.reduce((a, b) => a + b, 0) / n;
      const median = n % 2 === 0 ? (values[n / 2 - 1] + values[n / 2]) / 2 : values[Math.floor(n / 2)];
      const p99Index = Math.ceil(n * 0.99) - 1;
      const p99 = values[Math.min(p99Index, n - 1)];
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
      const sd = Math.sqrt(variance);
      
      return { count: n, mean, median, p99, sd };
    };
    
    // v7.1: Utiliser la même colonne de date que le reste de l'app (columns[1] = 2ème colonne)
    if (columns.length < 2) {
      alert('Le fichier doit avoir au moins 2 colonnes (la 2ème est la date)');
      return;
    }
    
    const dateColumn = columns[1]; // 2nd column = Local Date & Time
    addLog(`Utilisation de la colonne de date: "${dateColumn}"`)
    
    // Détecter toutes les années présentes dans les données
    const yearsSet = new Set();
    data.forEach(d => {
      if (d[dateColumn]) {
        const year = new Date(d[dateColumn]).getFullYear();
        if (!isNaN(year) && year >= 1900 && year <= 2100) {
          yearsSet.add(year);
        }
      }
    });
    
    const years = Array.from(yearsSet).sort((a, b) => a - b);
    
    if (years.length === 0) {
      alert(`Aucune année détectée dans la colonne "${dateColumn}".\nVérifiez le format des dates.`);
      return;
    }
    
    addLog(`Années détectées: ${years.join(', ')}`);
    
    // v7.1: Fonction helper pour filtrer par date MM-DD ET année
    const filterByDateRangeAndYear = (data, startMMDD, endMMDD, year) => {
      const [startMonth, startDay] = startMMDD.split('-').map(Number);
      const [endMonth, endDay] = endMMDD.split('-').map(Number);
      
      return data.filter(d => {
        if (!d[dateColumn]) return false;
        
        const date = new Date(d[dateColumn]);
        const dataYear = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // Vérifier l'année
        if (dataYear !== year) return false;
        
        // Vérifier la plage de dates (MM-DD)
        if (startMonth > endMonth) {
          // Plage qui traverse le changement d'année (ex: 11-01 à 02-28)
          return (month > startMonth || (month === startMonth && day >= startDay)) ||
                 (month < endMonth || (month === endMonth && day <= endDay));
        }
        
        // Cas normal (ex: 01-01 à 03-15)
        if (month < startMonth || month > endMonth) return false;
        if (month === startMonth && day < startDay) return false;
        if (month === endMonth && day > endDay) return false;
        return true;
      });
    };
    
    // Définir les 4 conditions PSIE
    const conditions = [
      {
        periode: 'a) du 1er janvier au 15 mars',
        type: 'Avec neige - Sans Voie lactée',
        dateStart: '01-01',
        dateEnd: '03-15',
        filters: d => d.MSAS != null && !isNaN(d.MSAS) && 
                     d.MSAS > 8 && 
                     d.sun_alt != null && d.sun_alt < -18 && 
                     d.moon_alt != null && d.moon_alt < -5 && 
                     d.gal_lat != null && d.gal_lat > 40 && 
                     d.sd_10min != null && d.sd_10min < 0.0101
      },
      {
        periode: 'b) du 1er avril au 1er juillet',
        type: 'Sans neige - Sans Voie lactée',
        dateStart: '04-01',
        dateEnd: '07-01',
        filters: d => d.MSAS != null && !isNaN(d.MSAS) && 
                     d.MSAS > 8 && 
                     d.sun_alt != null && d.sun_alt < -18 && 
                     d.moon_alt != null && d.moon_alt < -5 && 
                     d.gal_lat != null && d.gal_lat > 40 && 
                     d.sd_10min != null && d.sd_10min < 0.0101
      },
      {
        periode: 'c) du 1er avril au 1er octobre',
        type: 'Dégagé',
        dateStart: '04-01',
        dateEnd: '10-01',
        filters: d => d.MSAS != null && !isNaN(d.MSAS) && 
                     d.MSAS > 8 && 
                     d.sun_alt != null && d.sun_alt < -18 && 
                     d.moon_alt != null && d.moon_alt < -5 && 
                     d.sd_10min != null && d.sd_10min < 0.0101
      },
      {
        periode: 'c) du 1er avril au 1er octobre',
        type: 'Nuageux',
        dateStart: '04-01',
        dateEnd: '10-01',
        filters: d => d.MSAS != null && !isNaN(d.MSAS) && 
                     d.MSAS > 8 && 
                     d.sun_alt != null && d.sun_alt < -18 && 
                     d.moon_alt != null && d.moon_alt < -5 && 
                     d.sd_10min != null && d.sd_10min > 0.0101
      }
    ];
    
    // v7.1: Calculer pour chaque année
    const allResults = [];
    
    years.forEach(year => {
      conditions.forEach(cond => {
        // Filtrer par date ET année
        const dateFiltered = filterByDateRangeAndYear(data, cond.dateStart, cond.dateEnd, year);
        
        // Appliquer les filtres spécifiques
        const filtered = dateFiltered.filter(cond.filters);
        
        // Calculer les stats
        const stats = calculateStats(filtered);
        
        addLog(`${year} - ${cond.type}: ${stats.count} mesures`);
        
        allResults.push({
          annee: year,
          photometre,
          periode: cond.periode,
          type: cond.type,
          data: stats.count,
          mean: stats.mean,
          p50: stats.median,
          p99: stats.p99,
          sd: stats.sd
        });
      });
    });
    
    setPsieResults(allResults);
    addLog(`Calcul PSIE terminé: ${years.length} années, ${allResults.length} lignes`);
  };
  
  // v7.1: Fonction pour copier les résultats PSIE (avec virgule décimale)
  const copyPSIEResults = () => {
    if (!psieResults) return;
    
    // Format TSV avec virgule décimale pour Excel français
    let tsv = 'Année\tPhotomètre\tPériode de collecte\tType de période/conditions\tNombre de mesures (Data)\tMoyenne (Mean)\tMédiane (P50)\t99e percentile (P99)\tÉcart-type (SD)\n';
    
    psieResults.forEach(r => {
      const meanStr = r.mean.toFixed(3).replace('.', ',');
      const p50Str = r.p50.toFixed(3).replace('.', ',');
      const p99Str = r.p99.toFixed(3).replace('.', ',');
      const sdStr = r.sd.toFixed(3).replace('.', ',');
      tsv += `${r.annee}\t${r.photometre}\t${r.periode}\t${r.type}\t${r.data}\t${meanStr}\t${p50Str}\t${p99Str}\t${sdStr}\n`;
    });
    
    navigator.clipboard.writeText(tsv).then(() => {
      alert('✅ Résultats copiés dans le presse-papiers !\nVous pouvez les coller dans Excel ou Google Sheets.\n\nFormat: virgule décimale (,) pour Excel français');
    }).catch(() => {
      alert('❌ Erreur lors de la copie. Essayez le téléchargement CSV.');
    });
  };
  
  // v7.1: Fonction pour télécharger les résultats en CSV (point décimal international)
  const downloadPSIECSV = () => {
    if (!psieResults) return;
    
    let csv = 'Année,Photomètre,Période de collecte,Type de période/conditions,Nombre de mesures (Data),Moyenne (Mean),Médiane (P50),99e percentile (P99),Écart-type (SD)\n';
    
    psieResults.forEach(r => {
      csv += `${r.annee},"${r.photometre}","${r.periode}","${r.type}",${r.data},${r.mean.toFixed(2)},${r.p50.toFixed(2)},${r.p99.toFixed(2)},${r.sd.toFixed(2)}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `PSIE_${psieResults[0].photometre}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%)',
      color: '#e0e6ed',
      fontFamily: '"JetBrains Mono", "Courier New", monospace',
      padding: '2rem'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap');
        
        .stat-card {
          background: rgba(20, 25, 45, 0.6);
          border: 1px solid rgba(0, 255, 170, 0.2);
          border-radius: 4px;
          padding: 1.5rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .stat-card:hover {
          border-color: rgba(0, 255, 170, 0.5);
          box-shadow: 0 0 20px rgba(0, 255, 170, 0.15);
          transform: translateY(-2px);
        }
        
        .upload-zone {
          border: 2px dashed rgba(0, 255, 170, 0.3);
          background: rgba(20, 25, 45, 0.4);
          padding: 3rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .upload-zone:hover {
          border-color: rgba(0, 255, 170, 0.6);
          background: rgba(20, 25, 45, 0.6);
        }
        
        input, select {
          background: rgba(20, 25, 45, 0.8);
          border: 1px solid rgba(0, 255, 170, 0.3);
          color: #e0e6ed;
          padding: 0.5rem;
          border-radius: 4px;
          font-family: inherit;
          font-size: 0.9rem;
        }
        
        input:focus, select:focus {
          outline: none;
          border-color: rgba(0, 255, 170, 0.6);
          box-shadow: 0 0 10px rgba(0, 255, 170, 0.2);
        }
        
        button {
          background: rgba(0, 255, 170, 0.15);
          border: 1px solid rgba(0, 255, 170, 0.4);
          color: #00ffaa;
          padding: 0.6rem 1.2rem;
          border-radius: 4px;
          cursor: pointer;
          font-family: inherit;
          font-weight: 600;
          transition: all 0.2s ease;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
        }
        
        button:hover {
          background: rgba(0, 255, 170, 0.25);
          border-color: rgba(0, 255, 170, 0.7);
          box-shadow: 0 0 15px rgba(0, 255, 170, 0.3);
        }
        
        .filter-row {
          background: rgba(20, 25, 45, 0.5);
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 0.5rem;
          border-left: 3px solid rgba(0, 255, 170, 0.5);
        }
        
        .metric-value {
          font-size: 2rem;
          font-weight: 700;
          color: #00ffaa;
          margin: 0.5rem 0;
          text-shadow: 0 0 10px rgba(0, 255, 170, 0.3);
        }
        
        .metric-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(224, 230, 237, 0.6);
        }
      `}</style>

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '3rem',
            margin: '0 0 0.5rem 0',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #00ffaa 0%, #00d4ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 40px rgba(0, 255, 170, 0.2)',
            letterSpacing: '-0.02em'
          }}>
            Analyseur TESS-W
          </h1>
          <p style={{ color: 'rgba(224, 230, 237, 0.7)', fontSize: '1rem', margin: 0 }}>
            Photométrie • Météo • Astronomie
          </p>
          <p style={{ color: 'rgba(224, 230, 237, 0.6)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Requiert des fichiers .dat{' '}
            <a 
              href="https://remboucher.github.io/enrichisseur-astronomique/" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                color: '#00ffaa', 
                textDecoration: 'underline',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.7'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              préalablement enrichis
            </a>
          </p>
        </header>

        {/* Loading indicator */}
        {isCalculating && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(0, 255, 170, 0.2)',
            border: '1px solid rgba(0, 255, 170, 0.5)',
            padding: '0.75rem 1.5rem',
            borderRadius: '4px'
          }}>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(0, 255, 170, 0.3)',
              borderTop: '2px solid #00ffaa',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }} />
            <span style={{ fontSize: '0.85rem', color: '#00ffaa', fontWeight: 600 }}>
              Calcul en cours...
            </span>
          </div>
        )}

        {data.length === 0 ? (
          <>
            <div 
              className="upload-zone" 
              onClick={() => {
                addLog('Upload zone clicked');
                document.getElementById('fileInput').click();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                addLog('File dropped');
                
                const files = e.dataTransfer.files;
                if (files && files.length > 0) {
                  const file = files[0];
                  addLog(`Dropped file: ${file.name}, type: ${file.type}, size: ${file.size}`);
                  
                  // Simuler l'événement onChange de l'input
                  const input = document.getElementById('fileInput');
                  const dataTransfer = new DataTransfer();
                  dataTransfer.items.add(file);
                  input.files = dataTransfer.files;
                  
                  // Déclencher handleFileUpload
                  handleFileUpload({ target: { files: [file] } });
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              style={{
                border: isDragging ? '2px dashed #00ffaa' : undefined,
                background: isDragging ? 'rgba(0, 255, 170, 0.1)' : undefined
              }}
            >
              <div style={{
                textAlign: 'center',
                cursor: 'pointer'
              }}>
                <div style={{
                  fontSize: '3rem',
                  marginBottom: '1rem',
                  opacity: 0.8
                }}>📁</div>
                <div style={{
                  fontSize: '1.2rem',
                  marginBottom: '0.5rem',
                  color: '#00ffaa',
                  fontWeight: 600
                }}>
                  Déposez votre fichier .DAT
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'rgba(224, 230, 237, 0.6)'
                }}>
                  ou cliquez pour sélectionner
                </div>
              </div>
              <input
                id="fileInput"
                type="file"
                accept=".dat,.txt,.csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>

            {debugLogs.length > 0 && (
              <div style={{
                marginTop: '2rem',
                background: 'rgba(20, 25, 45, 0.6)',
                border: '1px solid rgba(255, 100, 100, 0.3)',
                padding: '1.5rem',
                borderRadius: '4px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255, 100, 100, 0.7)', fontWeight: 600 }}>
                    🔍 Logs de Debug
                  </div>
                  <button onClick={() => setDebugLogs([])}>Effacer</button>
                </div>
                {debugLogs.map((log, i) => (
                  <div key={i} style={{
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: 'rgba(224, 230, 237, 0.7)',
                    marginBottom: '0.25rem',
                    lineHeight: '1.4'
                  }}>
                    {log}
                  </div>
                ))}
              </div>
            )}

            {isLoading && (
              <div style={{ marginTop: '2rem' }}>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'rgba(224, 230, 237, 0.8)',
                  marginBottom: '0.5rem'
                }}>
                  Chargement... {loadingProgress}%
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(20, 25, 45, 0.6)',
                  border: '1px solid rgba(0, 255, 170, 0.3)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${loadingProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #00ffaa, #00d4ff)',
                    transition: 'width 0.3s ease',
                    boxShadow: '0 0 20px rgba(0, 255, 170, 0.5)'
                  }} />
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              background: 'rgba(20, 25, 45, 0.5)',
              padding: '1rem',
              borderRadius: '4px',
              borderLeft: '3px solid rgba(0, 255, 170, 0.5)'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(224, 230, 237, 0.6)', marginBottom: '0.25rem' }}>
                  Fichier chargé
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {fileName} · {data.length.toLocaleString('fr-FR')} lignes
                </div>
              </div>
              <button onClick={() => {
                setData([]);
                setColumns([]);
                setSelectedColumn('');
                setSelectedColumnY('');
                setFilters([]);
                setDebugLogs([]);
                setDateRange({ start: '', end: '' });
                setMultiYearFilter({ enabled: false, monthDayStart: '04-01', monthDayEnd: '06-30' });
              }}>
                Nouveau fichier
              </button>
            </div>

            {/* NEW: Sélection colonne pour Scatter Plot */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(224, 230, 237, 0.6)', display: 'block', marginBottom: '0.5rem' }}>
                  Colonne analysée (X)
                </label>
                <select
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                >
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(224, 230, 237, 0.6)', display: 'block', marginBottom: '0.5rem' }}>
                  Colonne pour Scatter Plot (Y) - Optionnel
                </label>
                <select
                  value={selectedColumnY}
                  onChange={(e) => setSelectedColumnY(e.target.value)}
                >
                  <option value="">Aucune (désactiver scatter plot)</option>
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filtres existants + NEW: Multi-année toggle */}
            <div style={{
              background: 'rgba(20, 25, 45, 0.5)',
              padding: '1.5rem',
              borderRadius: '4px',
              marginBottom: '2rem',
              borderLeft: '3px solid rgba(0, 255, 170, 0.5)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(224, 230, 237, 0.8)', fontWeight: 600 }}>
                  🔍 Filtres
                </div>
                <button onClick={addFilter}>+ Ajouter filtre</button>
              </div>

              {/* Filtres rapides saisons */}
              <div style={{ 
                background: 'rgba(100, 150, 255, 0.1)',
                border: '1px solid rgba(100, 150, 255, 0.3)',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(100, 150, 255, 0.8)', fontWeight: 600, marginBottom: '0.75rem' }}>
                  ⏰ Filtres rapides : Saisons
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                  <button 
                    onClick={() => applyDateQuickFilter('all')}
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', background: 'rgba(100, 150, 255, 0.2)' }}
                  >
                    Toutes données
                  </button>
                  <button 
                    onClick={() => applyDateQuickFilter('fullyear')}
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', background: 'rgba(100, 150, 255, 0.2)' }}
                  >
                    Année complète
                  </button>
                  <button 
                    onClick={() => applyDateQuickFilter('winter')}
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', background: 'rgba(100, 150, 255, 0.2)' }}
                  >
                    Hiver : 1er Jan - 15 Mar
                  </button>
                  <button 
                    onClick={() => applyDateQuickFilter('spring')}
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', background: 'rgba(100, 150, 255, 0.2)' }}
                  >
                    Printemps : 1er Avr - 1er Jul
                  </button>
                  <button 
                    onClick={() => applyDateQuickFilter('summer')}
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem', background: 'rgba(100, 150, 255, 0.2)' }}
                  >
                    Estival : 1er Avr - 1er Oct
                  </button>
                </div>
              </div>

              {/* Filtres rapides colonnes */}
              <div style={{ 
                background: 'rgba(255, 150, 100, 0.1)',
                border: '1px solid rgba(255, 150, 100, 0.3)',
                padding: '1rem',
                borderRadius: '4px',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255, 150, 100, 0.8)', fontWeight: 600, marginBottom: '0.75rem' }}>
                  ⚡ Filtres rapides : Colonnes
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
                  <button 
                    onClick={() => addQuickFilter('MSAS', '>', '8')}
                    style={{ 
                      padding: '0.5rem 0.6rem', 
                      background: 'rgba(255, 150, 100, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '3.5rem'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.15rem' }}>Seuil de mesure</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.7)' }}>MSAS &gt;8</div>
                  </button>
                  <button 
                    onClick={() => addQuickFilter('sun_alt', '<', '-18')}
                    style={{ 
                      padding: '0.5rem 0.6rem', 
                      background: 'rgba(255, 150, 100, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '3.5rem'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.15rem' }}>Nuit astro</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.7)' }}>sun_alt &lt;-18</div>
                  </button>
                  <button 
                    onClick={() => addQuickFilter('moon_alt', '<', '-5')}
                    style={{ 
                      padding: '0.5rem 0.6rem', 
                      background: 'rgba(255, 150, 100, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '3.5rem'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.15rem' }}>Sans lune</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.7)' }}>moon_alt &lt;-5</div>
                  </button>
                  <button 
                    onClick={() => addQuickFilter('sd_10min', '<', '0.0101')}
                    style={{ 
                      padding: '0.5rem 0.6rem', 
                      background: 'rgba(255, 150, 100, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '3.5rem'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.15rem' }}>Sans Nuages (selon SD)</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.7)' }}>sd_10min &lt;0.0101</div>
                  </button>
                  <button 
                    onClick={() => addQuickFilter('cloud_index', '<', '40')}
                    style={{ 
                      padding: '0.5rem 0.6rem', 
                      background: 'rgba(255, 150, 100, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '3.5rem'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.15rem' }}>Sans Nuages (selon ΔTemp)</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.7)' }}>cloud_index &lt;40</div>
                  </button>
                  <button 
                    onClick={() => addQuickFilter('gal_lat', '>', '40')}
                    style={{ 
                      padding: '0.5rem 0.6rem', 
                      background: 'rgba(255, 150, 100, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '3.5rem'
                    }}
                  >
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.15rem' }}>Sans voie lactée</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.7)' }}>gal_lat &gt;40</div>
                  </button>
                </div>
              </div>

              {/* v7.0: PSIE Sépaq */}
              <div className="filter-row" style={{ marginBottom: '1.5rem', borderTop: '2px solid rgba(100, 200, 255, 0.3)', paddingTop: '1.5rem' }}>
                <div style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: 700, 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.1em', 
                  color: 'rgba(100, 200, 255, 0.9)', 
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  📊 PSIE SÉPAQ
                </div>
                
                <button 
                  onClick={calculatePSIE}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, rgba(100, 200, 255, 0.3), rgba(150, 100, 255, 0.3))',
                    border: '1px solid rgba(100, 200, 255, 0.5)',
                    borderRadius: '4px',
                    color: 'rgba(224, 230, 237, 0.95)',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    width: '100%',
                    marginBottom: psieResults ? '1rem' : '0'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, rgba(100, 200, 255, 0.4), rgba(150, 100, 255, 0.4))';
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'linear-gradient(135deg, rgba(100, 200, 255, 0.3), rgba(150, 100, 255, 0.3))';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  📊 Calculer les données PSIE Sépaq
                </button>

                {psieResults && (
                  <div style={{
                    background: 'rgba(20, 25, 45, 0.6)',
                    border: '1px solid rgba(100, 200, 255, 0.3)',
                    borderRadius: '4px',
                    padding: '1rem',
                    marginTop: '1rem'
                  }}>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 600, 
                      color: 'rgba(100, 200, 255, 0.9)', 
                      marginBottom: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>Résultats PSIE - {psieResults[0].photometre} ({[...new Set(psieResults.map(r => r.annee))].sort((a,b) => a-b).join(', ')})</span>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={copyPSIEResults}
                          style={{
                            padding: '0.4rem 0.8rem',
                            background: 'rgba(100, 200, 255, 0.2)',
                            border: '1px solid rgba(100, 200, 255, 0.4)',
                            borderRadius: '3px',
                            color: 'rgba(224, 230, 237, 0.9)',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          📋 Copier
                        </button>
                        <button
                          onClick={downloadPSIECSV}
                          style={{
                            padding: '0.4rem 0.8rem',
                            background: 'rgba(100, 200, 255, 0.2)',
                            border: '1px solid rgba(100, 200, 255, 0.4)',
                            borderRadius: '3px',
                            color: 'rgba(224, 230, 237, 0.9)',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          💾 CSV
                        </button>
                      </div>
                    </div>

                    <div style={{ 
                      overflowX: 'auto',
                      fontSize: '0.75rem'
                    }}>
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.75rem'
                      }}>
                        <thead>
                          <tr style={{ 
                            background: 'rgba(100, 200, 255, 0.1)', 
                            borderBottom: '1px solid rgba(100, 200, 255, 0.3)' 
                          }}>
                            <th style={{ padding: '0.5rem', textAlign: 'center', color: 'rgba(224, 230, 237, 0.7)' }}>Année</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left', color: 'rgba(224, 230, 237, 0.7)' }}>Période</th>
                            <th style={{ padding: '0.5rem', textAlign: 'left', color: 'rgba(224, 230, 237, 0.7)' }}>Type</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', color: 'rgba(224, 230, 237, 0.7)' }}>Data</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', color: 'rgba(224, 230, 237, 0.7)' }}>Mean</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', color: 'rgba(224, 230, 237, 0.7)' }}>P50</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', color: 'rgba(224, 230, 237, 0.7)' }}>P99</th>
                            <th style={{ padding: '0.5rem', textAlign: 'right', color: 'rgba(224, 230, 237, 0.7)' }}>SD</th>
                          </tr>
                        </thead>
                        <tbody>
                          {psieResults.map((result, idx) => (
                            <tr key={idx} style={{ 
                              borderBottom: '1px solid rgba(100, 200, 255, 0.1)',
                              background: idx % 2 === 0 ? 'transparent' : 'rgba(100, 200, 255, 0.05)'
                            }}>
                              <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 600, color: result.type.includes('Avec neige') ? '#FFF' : result.type.includes('Sans neige') ? '#66BB6A' : result.type === 'Dégagé' ? '#64C8FF' : '#999' }}>
                                {result.annee}
                              </td>
                              <td style={{ padding: '0.5rem', whiteSpace: 'nowrap', color: result.type.includes('Avec neige') ? '#FFF' : result.type.includes('Sans neige') ? '#66BB6A' : result.type === 'Dégagé' ? '#64C8FF' : '#999' }}>
                                {result.periode}
                              </td>
                              <td style={{ padding: '0.5rem', color: result.type.includes('Avec neige') ? '#FFF' : result.type.includes('Sans neige') ? '#66BB6A' : result.type === 'Dégagé' ? '#64C8FF' : '#999' }}>
                                {result.type}
                              </td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600 }}>
                                {result.data.toLocaleString('fr-FR')}
                              </td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', color: 'rgba(224, 230, 237, 0.9)' }}>
                                {result.mean.toFixed(3).replace('.', ',')}
                              </td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', color: 'rgba(224, 230, 237, 0.9)' }}>
                                {result.p50.toFixed(3).replace('.', ',')}
                              </td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', color: 'rgba(224, 230, 237, 0.9)' }}>
                                {result.p99.toFixed(3).replace('.', ',')}
                              </td>
                              <td style={{ padding: '0.5rem', textAlign: 'right', color: 'rgba(224, 230, 237, 0.9)' }}>
                                {result.sd.toFixed(3).replace('.', ',')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ 
                      marginTop: '1rem', 
                      fontSize: '0.7rem', 
                      color: 'rgba(224, 230, 237, 0.6)',
                      fontStyle: 'italic'
                    }}>
                      💡 Utilisez "📋 Copier" pour coller dans Excel/Google Sheets, ou "💾 CSV" pour télécharger
                    </div>
                  </div>
                )}
              </div>

              {/* Date range filter */}
              <div className="filter-row" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={dateRangeEnabled}
                    onChange={(e) => setDateRangeEnabled(e.target.checked)}
                    style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                  />
                  <label style={{ fontSize: '0.9rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600 }}>
                    Filtre par plage de dates
                  </label>
                </div>
                {dateRangeEnabled && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.6)', display: 'block', marginBottom: '0.25rem' }}>
                        Date début
                      </label>
                      <input
                        type="datetime-local"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.6)', display: 'block', marginBottom: '0.25rem' }}>
                        Date fin
                      </label>
                      <input
                        type="datetime-local"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* NEW: Multi-year filter */}
              <div className="filter-row">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={multiYearFilter.enabled}
                    onChange={(e) => setMultiYearFilter({ ...multiYearFilter, enabled: e.target.checked })}
                    style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                  />
                  <label style={{ fontSize: '0.9rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600 }}>
                    Comparaison multi-année (même période, années différentes)
                  </label>
                </div>
                {multiYearFilter.enabled && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.6)', display: 'block', marginBottom: '0.25rem' }}>
                        Jour-mois début (MM-DD)
                      </label>
                      <input
                        type="text"
                        placeholder="04-01"
                        value={multiYearFilter.monthDayStart}
                        onChange={(e) => setMultiYearFilter({ ...multiYearFilter, monthDayStart: e.target.value })}
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.6)', display: 'block', marginBottom: '0.25rem' }}>
                        Jour-mois fin (MM-DD)
                      </label>
                      <input
                        type="text"
                        placeholder="07-01"
                        value={multiYearFilter.monthDayEnd}
                        onChange={(e) => setMultiYearFilter({ ...multiYearFilter, monthDayEnd: e.target.value })}
                        style={{ fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Regular filters */}
              {filters.map((filter, idx) => (
                <div key={idx} className="filter-row">
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr auto', gap: '0.75rem', alignItems: 'center' }}>
                    <select
                      value={filter.column}
                      onChange={(e) => updateFilter(idx, 'column', e.target.value)}
                    >
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    <select
                      value={filter.operator}
                      onChange={(e) => updateFilter(idx, 'operator', e.target.value)}
                    >
                      <option value=">">{'>'}</option>
                      <option value="<">{'<'}</option>
                      <option value=">=">{'>='}</option>
                      <option value="<={">{'<='}</option>
                      <option value="=">=</option>
                      <option value="!=">{'\u2260'}</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Valeur"
                      value={filter.value}
                      onChange={(e) => updateFilter(idx, 'value', e.target.value)}
                    />
                    <button onClick={() => removeFilter(idx)} style={{ color: '#ff6b6b' }}>
                      ✕
                    </button>
                  </div>
                  {filteredData.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.5)', marginTop: '0.5rem' }}>
                      {getLinesAfterFilter(idx).toLocaleString('fr-FR')} lignes après ce filtre
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Statistiques avant et après filtrage - NEW: deux colonnes côte à côte */}
            {stats && statsBeforeFilter && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600 }}>
                  Comparaison : Avant / Après filtrage
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  {/* Avant */}
                  <div style={{
                    background: 'rgba(20, 25, 45, 0.5)',
                    border: '2px solid rgba(255, 100, 100, 0.3)',
                    padding: '1.5rem',
                    borderRadius: '4px'
                  }}>
                    <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255, 150, 150, 0.8)', fontWeight: 600, marginBottom: '1.5rem' }}>
                      ◀ Avant filtrage ({statsBeforeFilter.count.toLocaleString('fr-FR')} valeurs)
                    </div>
                    <div className="stat-card" style={{ marginBottom: '0.75rem' }}>
                      <div className="metric-label">Moyenne</div>
                      <div className="metric-value">{statsBeforeFilter.mean.toFixed(3)}</div>
                    </div>
                    <div className="stat-card" style={{ marginBottom: '0.75rem' }}>
                      <div className="metric-label">Médiane</div>
                      <div className="metric-value">{statsBeforeFilter.median.toFixed(3)}</div>
                    </div>
                    <div className="stat-card" style={{ marginBottom: '0.75rem' }}>
                      <div className="metric-label">P99</div>
                      <div className="metric-value">{statsBeforeFilter.p99.toFixed(3)}</div>
                    </div>
                    <div className="stat-card">
                      <div className="metric-label">Écart-type</div>
                      <div className="metric-value">{statsBeforeFilter.stdDev.toFixed(3)}</div>
                    </div>
                  </div>

                  {/* Après */}
                  <div style={{
                    background: 'rgba(20, 25, 45, 0.5)',
                    border: '2px solid rgba(0, 255, 170, 0.3)',
                    padding: '1.5rem',
                    borderRadius: '4px'
                  }}>
                    <div style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(0, 255, 170, 0.8)', fontWeight: 600, marginBottom: '1.5rem' }}>
                      ▶ Après filtrage ({stats.count.toLocaleString('fr-FR')} valeurs)
                    </div>
                    <div className="stat-card" style={{ marginBottom: '0.75rem' }}>
                      <div className="metric-label">Moyenne</div>
                      <div className="metric-value">{stats.mean.toFixed(3)}</div>
                    </div>
                    <div className="stat-card" style={{ marginBottom: '0.75rem' }}>
                      <div className="metric-label">Médiane</div>
                      <div className="metric-value">{stats.median.toFixed(3)}</div>
                    </div>
                    <div className="stat-card" style={{ marginBottom: '0.75rem' }}>
                      <div className="metric-label">P99</div>
                      <div className="metric-value">{stats.p99.toFixed(3)}</div>
                    </div>
                    <div className="stat-card">
                      <div className="metric-label">Écart-type</div>
                      <div className="metric-value">{stats.stdDev.toFixed(3)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* v5.5: Export des données filtrées */}
            {filteredData.length > 0 && (
              <div style={{
                background: 'rgba(20, 25, 45, 0.5)',
                border: '1px solid rgba(0, 255, 170, 0.2)',
                padding: '1.5rem',
                borderRadius: '4px',
                marginBottom: '2rem'
              }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600 }}>
                  Export des données
                </h2>
                <button
                  onClick={exportToCSV}
                  style={{
                    background: 'linear-gradient(135deg, #00ffaa 0%, #00cc88 100%)',
                    color: '#0a0e27',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(0, 255, 170, 0.3)'
                  }}
                >
                  📥 Exporter les données filtrées en .DAT ({filteredData.length.toLocaleString('fr-FR')} lignes)
                </button>
              </div>
            )}

            {/* NEW: Scatter plot */}
            {selectedColumnY && scatterData.length > 0 && (
              <div style={{
                background: 'rgba(20, 25, 45, 0.5)',
                border: '1px solid rgba(0, 255, 170, 0.2)',
                padding: '1.5rem',
                borderRadius: '4px',
                marginBottom: '2rem'
              }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600 }}>
                  Scatter Plot : {selectedColumn} vs {selectedColumnY}
                </h2>
                <div style={{ width: '100%', height: '800px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 170, 0.1)" />
                      <XAxis 
                        type="number" 
                        dataKey="x" 
                        stroke="rgba(224, 230, 237, 0.6)"
                        domain={scatterXLimits.enabled && scatterXLimits.min !== '' && scatterXLimits.max !== '' ? [parseFloat(scatterXLimits.min), parseFloat(scatterXLimits.max)] : ['auto', 'auto']}
                        allowDataOverflow={scatterXLimits.enabled}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="y" 
                        stroke="rgba(224, 230, 237, 0.6)"
                        domain={scatterYLimits.enabled && scatterYLimits.min !== '' && scatterYLimits.max !== '' ? [parseFloat(scatterYLimits.min), parseFloat(scatterYLimits.max)] : ['auto', 'auto']}
                        allowDataOverflow={scatterYLimits.enabled}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(10, 14, 39, 0.9)',
                          border: '1px solid rgba(0, 255, 170, 0.5)',
                          borderRadius: '4px',
                          color: '#e0e6ed'
                        }}
                        labelStyle={{
                          color: '#e0e6ed'
                        }}
                        itemStyle={{
                          color: '#e0e6ed'
                        }}
                        cursor={{ fill: 'rgba(0, 255, 170, 0.1)' }}
                      />
                      <Scatter name="Points" data={scatterDataDisplay} fill="#00ffaa" opacity={0.6} />
                      {scatterShowRegression && regressionLine.length > 0 && (
                        <Scatter 
                          name="Régression" 
                          data={regressionLine} 
                          fill="#FF6B6B" 
                          line={{ stroke: '#FF6B6B', strokeWidth: 3 }}
                          shape={() => null}
                        />
                      )}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(224, 230, 237, 0.6)' }}>
                    {scatterData.length.toLocaleString('fr-FR')} points affichés
                  </div>
                  
                  {/* Contrôles de régression */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={scatterShowRegression}
                        onChange={(e) => setScatterShowRegression(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.9rem', color: 'rgba(224, 230, 237, 0.85)', fontWeight: 600 }}>
                        📈 Régression
                      </span>
                    </label>
                    
                    {scatterShowRegression && (
                      <>
                        <select
                          value={scatterRegressionType}
                          onChange={(e) => setScatterRegressionType(e.target.value)}
                          style={{
                            padding: '0.3rem 0.6rem',
                            background: 'rgba(30, 35, 60, 0.8)',
                            border: '1px solid rgba(255, 107, 107, 0.3)',
                            borderRadius: '3px',
                            color: 'rgba(224, 230, 237, 0.9)',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="linear">Linéaire</option>
                          <option value="polynomial">Polynomiale</option>
                        </select>
                        
                        {scatterRegressionType === 'polynomial' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.85rem', color: 'rgba(224, 230, 237, 0.7)' }}>
                              Degré: {scatterPolynomialDegree}
                            </span>
                            <input
                              type="range"
                              min="2"
                              max="5"
                              step="1"
                              value={scatterPolynomialDegree}
                              onChange={(e) => setScatterPolynomialDegree(parseInt(e.target.value))}
                              style={{ width: '100px', cursor: 'pointer' }}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {/* Statistiques de régression */}
                {scatterShowRegression && regressionStats && (
                  <div style={{
                    background: 'rgba(255, 107, 107, 0.1)',
                    border: '1px solid rgba(255, 107, 107, 0.3)',
                    padding: '0.75rem 1rem',
                    borderRadius: '4px',
                    marginTop: '0.75rem'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600, marginBottom: '0.5rem' }}>
                      📊 Statistiques de régression {regressionStats.type === 'polynomial' ? `polynomiale (degré ${regressionStats.degree})` : 'linéaire'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', color: 'rgba(224, 230, 237, 0.8)' }}>
                      <div style={{ gridColumn: regressionStats.type === 'polynomial' ? '1 / -1' : 'auto' }}>
                        <span style={{ fontWeight: 600 }}>Équation:</span>{' '}
                        {regressionStats.type === 'linear' ? (
                          <>y = {regressionStats.m.toFixed(4)}x + {regressionStats.b.toFixed(4)}</>
                        ) : (
                          <>
                            y = {regressionStats.coeffs.map((c, i) => {
                              const absC = Math.abs(c);
                              const sign = i === 0 ? '' : (c >= 0 ? ' + ' : ' - ');
                              if (i === 0) return `${c.toFixed(4)}`;
                              if (i === 1) return `${sign}${absC.toFixed(4)}x`;
                              return `${sign}${absC.toFixed(4)}x^${i}`;
                            }).join('')}
                          </>
                        )}
                      </div>
                      <div>
                        <span style={{ fontWeight: 600 }}>R² =</span> {regressionStats.r2.toFixed(4)} ({(regressionStats.r2 * 100).toFixed(2)}%)
                      </div>
                      {regressionStats.type === 'linear' && (
                        <div>
                          <span style={{ fontWeight: 600 }}>Corrélation (r) =</span> {regressionStats.r.toFixed(4)}
                        </div>
                      )}
                      <div>
                        <span style={{ fontWeight: 600 }}>Points:</span> {regressionStats.n.toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                )}

                {/* X and Y axis controls for scatter */}
                <div style={{
                  background: 'rgba(20, 25, 45, 0.5)',
                  padding: '1rem',
                  borderRadius: '4px',
                  marginTop: '1rem',
                  borderLeft: '3px solid rgba(0, 255, 170, 0.5)'
                }}>
                  {/* Toggle inverser axes */}
                  <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(0, 255, 170, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={scatterSwapAxes}
                        onChange={(e) => setScatterSwapAxes(e.target.checked)}
                        style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                      />
                      <label style={{ fontSize: '0.9rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600, cursor: 'pointer' }}>
                        Inverser les axes (X ↔ Y)
                      </label>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* X axis controls */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={scatterXLimits.enabled}
                          onChange={(e) => setScatterXLimits(prev => ({ ...prev, enabled: e.target.checked }))}
                          style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                        />
                        <label style={{ fontSize: '0.9rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600 }}>
                          Limites X manuelles
                        </label>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.6)', display: 'block', marginBottom: '0.25rem' }}>
                            X Min
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={scatterXLimits.min}
                            onChange={(e) => setScatterXLimits(prev => ({ ...prev, min: e.target.value }))}
                            disabled={!scatterXLimits.enabled}
                            placeholder="Auto"
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.6)', display: 'block', marginBottom: '0.25rem' }}>
                            X Max
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={scatterXLimits.max}
                            onChange={(e) => setScatterXLimits(prev => ({ ...prev, max: e.target.value }))}
                            disabled={!scatterXLimits.enabled}
                            placeholder="Auto"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Y axis controls */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={scatterYLimits.enabled}
                          onChange={(e) => setScatterYLimits(prev => ({ ...prev, enabled: e.target.checked }))}
                          style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                        />
                        <label style={{ fontSize: '0.9rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600 }}>
                          Limites Y manuelles
                        </label>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.6)', display: 'block', marginBottom: '0.25rem' }}>
                            Y Min
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={scatterYLimits.min}
                            onChange={(e) => setScatterYLimits(prev => ({ ...prev, min: e.target.value }))}
                            disabled={!scatterYLimits.enabled}
                            placeholder="Auto"
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.6)', display: 'block', marginBottom: '0.25rem' }}>
                            Y Max
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={scatterYLimits.max}
                            onChange={(e) => setScatterYLimits(prev => ({ ...prev, max: e.target.value }))}
                            disabled={!scatterYLimits.enabled}
                            placeholder="Auto"
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* v5.5: Chronologie du ciel */}
            {filteredData.length > 0 && (
              <div style={{
                background: 'rgba(20, 25, 45, 0.5)',
                border: '1px solid rgba(0, 255, 170, 0.2)',
                padding: '1.5rem',
                borderRadius: '4px',
                marginBottom: '2rem'
              }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600 }}>
                  Chronologie du ciel (17h à 7h)
                </h2>
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showSkyTimeline} onChange={(e) => setShowSkyTimeline(e.target.checked)} />
                    <span style={{ fontSize: '0.9rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600 }}>
                      Afficher la chronologie
                    </span>
                  </label>
                  
                  {showSkyTimeline && skyTimelineData && (
                    <button onClick={() => {
                        const canvas = timelineCanvasRef.current;
                        if (!canvas) return;
                        canvas.toBlob((blob) => {
                          if (!blob) return;
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.download = `chronologie-${new Date().toISOString().split('T')[0]}.png`;
                          link.href = url;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                        });
                      }}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', background: 'rgba(0, 255, 170, 0.2)', border: '1px solid rgba(0, 255, 170, 0.3)', color: 'rgba(224, 230, 237, 0.9)', cursor: 'pointer', borderRadius: '4px' }}>
                      📥 Exporter PNG
                    </button>
                  )}
                </div>
                
                {showSkyTimeline && skyTimelineData && (
                  <div>
                    <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(20, 25, 45, 0.8)', borderRadius: '4px', border: '1px solid rgba(0, 255, 170, 0.2)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Légende MSAS
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ position: 'relative', width: '300px' }}>
                          <div style={{ display: 'flex', height: '20px', borderRadius: '2px', overflow: 'hidden', border: '1px solid rgba(0, 255, 170, 0.3)' }}>
                            {Array.from({ length: 100 }, (_, i) => {
                              const msas = 14 + (i / 99) * 10;
                              return <div key={i} style={{ flex: 1, background: getColorFromValue(msas) }} title={msas.toFixed(2)} />;
                            })}
                          </div>
                          <div style={{ position: 'relative', height: '20px', marginTop: '2px' }}>
                            {[14, 16, 18, 20, 22, 24].map(val => {
                              const percent = ((val - 14) / 10) * 100;
                              return (
                                <div key={val} style={{ position: 'absolute', left: `${percent}%`, transform: 'translateX(-50%)' }}>
                                  <div style={{ width: '1px', height: '5px', background: 'rgba(224, 230, 237, 0.5)', margin: '0 auto' }} />
                                  <div style={{ fontSize: '9px', color: 'rgba(224, 230, 237, 0.7)', marginTop: '2px' }}>{val}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    </div>

                    <div style={{ fontSize: '0.65rem', color: 'rgba(224, 230, 237, 0.6)', marginBottom: '0.5rem' }}>
                      {skyTimelineData.nightCount} nuits • Survolez pour détails
                    </div>

                    <div ref={timelineContainerRef} style={{ position: 'relative', overflowX: 'auto', overflowY: 'auto', maxHeight: '1081px', border: '1px solid rgba(0, 255, 170, 0.2)', borderRadius: '4px', background: 'rgba(20, 25, 45, 0.8)' }}
                      onMouseMove={(e) => {
                        const canvas = timelineCanvasRef.current;
                        if (!canvas) return;
                        const rect = canvas.getBoundingClientRect();
                        const x = e.clientX - rect.left, y = e.clientY - rect.top;
                        const leftMargin = 50, topMargin = 60;
                        if (x < leftMargin || y < topMargin) { setTimelineTooltip(null); return; }
                        
                        const nightIdx = Math.floor((x - leftMargin) / 5);
                        // Inversion : le canvas dessine avec (841 - relativeMinutes)
                        // donc pour retrouver relativeMinutes depuis y, il faut inverser
                        const relativeMinutes = 840 - Math.floor((y - topMargin));
                        
                        if (nightIdx >= 0 && nightIdx < skyTimelineData.sortedNights.length && relativeMinutes >= 0 && relativeMinutes <= 840) {
                          const nightDate = skyTimelineData.sortedNights[nightIdx];
                          const msas = skyTimelineData.nightsMap.get(nightDate).get(relativeMinutes);
                          
                          if (msas !== undefined) {
                            let hour, minute;
                            if (relativeMinutes < 420) {
                              hour = 17 + Math.floor(relativeMinutes / 60);
                              minute = relativeMinutes % 60;
                            } else {
                              const afterMidnight = relativeMinutes - 420;
                              hour = Math.floor(afterMidnight / 60);
                              minute = afterMidnight % 60;
                            }
                            setTimelineTooltip({ x: e.clientX, y: e.clientY, date: nightDate, hour: `${hour}h${minute > 0 ? String(minute).padStart(2, '0') : ''}`, msas: msas.toFixed(2) });
                          } else {
                            setTimelineTooltip(null);
                          }
                        }
                      }}
                      onMouseLeave={() => setTimelineTooltip(null)}>
                      <canvas ref={timelineCanvasRef} style={{ display: 'block', imageRendering: 'pixelated' }} />
                    </div>

                    {timelineTooltip && (
                      <div style={{ position: 'fixed', left: timelineTooltip.x + 10, top: timelineTooltip.y + 10, background: 'rgba(20, 25, 45, 0.95)', border: '1px solid rgba(0, 255, 170, 0.5)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.9)', pointerEvents: 'none', zIndex: 1000, boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
                        <div><strong>{timelineTooltip.date}</strong></div>
                        <div>{timelineTooltip.hour}</div>
                        <div>MSAS: <strong>{timelineTooltip.msas}</strong></div>
                      </div>
                    )}

                    <div style={{ fontSize: '0.6rem', color: 'rgba(224, 230, 237, 0.6)', marginTop: '0.5rem' }}>
                      Haut: 17h • Ligne orange: 0h (minuit) • Bas: 7h (lendemain)
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NEW: Comparaison multi-année tableau */}
            {multiYearFilter.enabled && yearlyComparison.length > 0 && (
              <div style={{
                background: 'rgba(20, 25, 45, 0.5)',
                border: '1px solid rgba(0, 255, 170, 0.2)',
                padding: '1.5rem',
                borderRadius: '4px',
                marginBottom: '2rem',
                overflowX: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600 }}>
                    Comparaison multi-année ({multiYearFilter.monthDayStart} au {multiYearFilter.monthDayEnd})
                  </h2>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        try {
                          // Export CSV avec BOM UTF-8 pour Excel
                          const headers = ['Année', 'Compte', 'Moyenne', 'Médiane', 'P99', 'Écart-type', 'Min', 'Max'];
                          const rows = yearlyComparison.map(row => [
                            row.year,
                            row.count,
                            row.mean.toFixed(3),
                            row.median.toFixed(3),
                            row.p99.toFixed(3),
                            row.stdDev.toFixed(3),
                            row.min.toFixed(3),
                            row.max.toFixed(3)
                          ]);
                          const csvContent = [
                            headers.join(','),
                            ...rows.map(r => r.join(','))
                          ].join('\n');
                          // BOM UTF-8 pour Excel
                          const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                          const link = document.createElement('a');
                          link.href = URL.createObjectURL(blob);
                          link.download = `comparaison-${multiYearFilter.monthDayStart}-${multiYearFilter.monthDayEnd}.csv`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(link.href);
                        } catch (error) {
                          console.error('Erreur export CSV:', error);
                          alert('Erreur lors de l\'export CSV');
                        }
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        fontSize: '0.85rem',
                        background: 'rgba(0, 255, 170, 0.2)',
                        border: '1px solid rgba(0, 255, 170, 0.3)',
                        color: 'rgba(224, 230, 237, 0.9)',
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                    >
                      Export CSV
                    </button>
                    
                  </div>
                </div>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.9rem'
                }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(0, 255, 170, 0.3)' }}>
                      <th style={{ textAlign: 'left', padding: '0.75rem', color: 'rgba(0, 255, 170, 0.8)', fontWeight: 600 }}>Année</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem', color: 'rgba(0, 255, 170, 0.8)', fontWeight: 600 }}>Compte</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem', color: 'rgba(0, 255, 170, 0.8)', fontWeight: 600 }}>Moyenne</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem', color: 'rgba(0, 255, 170, 0.8)', fontWeight: 600 }}>Médiane</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem', color: 'rgba(0, 255, 170, 0.8)', fontWeight: 600 }}>P99</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem', color: 'rgba(0, 255, 170, 0.8)', fontWeight: 600 }}>Écart-type</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem', color: 'rgba(0, 255, 170, 0.8)', fontWeight: 600 }}>Min</th>
                      <th style={{ textAlign: 'right', padding: '0.75rem', color: 'rgba(0, 255, 170, 0.8)', fontWeight: 600 }}>Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyComparison.map((row, idx) => (
                      <tr key={idx} style={{
                        borderBottom: '1px solid rgba(0, 255, 170, 0.1)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(0, 255, 170, 0.05)'
                      }}>
                        <td style={{ padding: '0.75rem', color: '#00ffaa', fontWeight: 600 }}>{row.year}</td>
                        <td style={{ textAlign: 'right', padding: '0.75rem', color: 'rgba(224, 230, 237, 0.8)' }}>{row.count.toLocaleString('fr-FR')}</td>
                        <td style={{ textAlign: 'right', padding: '0.75rem', color: 'rgba(224, 230, 237, 0.8)' }}>{row.mean.toFixed(3)}</td>
                        <td style={{ textAlign: 'right', padding: '0.75rem', color: 'rgba(224, 230, 237, 0.8)' }}>{row.median.toFixed(3)}</td>
                        <td style={{ textAlign: 'right', padding: '0.75rem', color: 'rgba(224, 230, 237, 0.8)' }}>{row.p99.toFixed(3)}</td>
                        <td style={{ textAlign: 'right', padding: '0.75rem', color: 'rgba(224, 230, 237, 0.8)' }}>{row.stdDev.toFixed(3)}</td>
                        <td style={{ textAlign: 'right', padding: '0.75rem', color: 'rgba(224, 230, 237, 0.8)' }}>{row.min.toFixed(3)}</td>
                        <td style={{ textAlign: 'right', padding: '0.75rem', color: 'rgba(224, 230, 237, 0.8)' }}>{row.max.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Histogramme */}
            {stats && histogramData.length > 0 && (
              <div style={{
                background: 'rgba(20, 25, 45, 0.5)',
                border: '1px solid rgba(0, 255, 170, 0.2)',
                padding: '1.5rem',
                borderRadius: '4px',
                marginBottom: '2rem'
              }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600 }}>
                  Distribution : {selectedColumn}
                </h2>
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={showHistogram}
                      onChange={(e) => setShowHistogram(e.target.checked)}
                      style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                    />
                    <label style={{ fontSize: '0.9rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600, cursor: 'pointer' }}>
                      Afficher la distribution
                    </label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={histogramUseGradient}
                      onChange={(e) => setHistogramUseGradient(e.target.checked)}
                      style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                    />
                    <label style={{ fontSize: '0.9rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600, cursor: 'pointer' }}>
                      Gradient couleur (14-24)
                    </label>
                  </div>
                </div>
                {showHistogram && (
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={histogramData}
                      margin={{ top: 20, right: 20, bottom: 20, left: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 170, 0.1)" />
                      <XAxis
                        dataKey="range"
                        tick={{ fontSize: 12, fill: 'rgba(224, 230, 237, 0.6)' }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: 'rgba(224, 230, 237, 0.6)' }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(10, 14, 39, 0.9)',
                          border: '1px solid rgba(0, 255, 170, 0.5)',
                          borderRadius: '4px',
                          color: '#e0e6ed'
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {histogramUseGradient ? (
                          histogramData.map((entry, index) => {
                            // Calculer la valeur centrale du bin pour obtenir la couleur
                            const binCenter = (entry.binStart + entry.binEnd) / 2;
                            const color = getColorFromValue(binCenter);
                            return <Cell key={`cell-${index}`} fill={color} />;
                          })
                        ) : (
                          histogramData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="#00ffaa" />
                          ))
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                )}

                {/* X-axis controls for histogram */}
                <div style={{
                  background: 'rgba(20, 25, 45, 0.5)',
                  padding: '1rem',
                  borderRadius: '4px',
                  marginTop: '1rem',
                  borderLeft: '3px solid rgba(0, 255, 170, 0.5)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={histogramXLimits.enabled}
                      onChange={(e) => setHistogramXLimits(prev => ({ ...prev, enabled: e.target.checked }))}
                      style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                    />
                    <label style={{ fontSize: '0.9rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600 }}>
                      Limites X manuelles (Histogramme)
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.6)', display: 'block', marginBottom: '0.25rem' }}>
                        X Min
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={histogramXLimits.min}
                        onChange={(e) => setHistogramXLimits(prev => ({ ...prev, min: e.target.value }))}
                        disabled={!histogramXLimits.enabled}
                        placeholder="Auto"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.6)', display: 'block', marginBottom: '0.25rem' }}>
                        X Max
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={histogramXLimits.max}
                        onChange={(e) => setHistogramXLimits(prev => ({ ...prev, max: e.target.value }))}
                        disabled={!histogramXLimits.enabled}
                        placeholder="Auto"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Boxplot (ancien code, gardé intact) */}
            {stats && boxplotData.length > 0 && (
              <div style={{
                background: 'rgba(20, 25, 45, 0.5)',
                border: '1px solid rgba(0, 255, 170, 0.2)',
                padding: '1.5rem',
                borderRadius: '4px',
                marginBottom: '2rem'
              }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600 }}>
                  {boxplotType === 'boxplot' ? 'Boîtes à moustaches' : 'Violin Plot'} par mois : {selectedColumn}
                </h2>
                <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {['boxplot', 'violin'].map(type => (
                    <button key={type} onClick={() => setBoxplotType(type)} style={{
                      padding: '0.4rem 0.9rem', fontSize: '0.82rem', cursor: 'pointer', borderRadius: '4px',
                      background: boxplotType === type ? 'rgba(0, 255, 170, 0.25)' : 'rgba(0, 255, 170, 0.08)',
                      border: boxplotType === type ? '2px solid rgba(0, 255, 170, 0.6)' : '1px solid rgba(0, 255, 170, 0.25)',
                      color: 'rgba(224, 230, 237, 0.9)', fontWeight: boxplotType === type ? 600 : 400
                    }}>
                      {type === 'boxplot' ? '📊 Boxplot' : '🎻 Violin'}
                    </button>
                  ))}
                </div>
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={showBoxplot}
                      onChange={(e) => setShowBoxplot(e.target.checked)}
                      style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                    />
                    <label style={{ fontSize: '0.9rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600, cursor: 'pointer' }}>
                      Afficher le boxplot
                    </label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={showBoxplotMedians}
                      onChange={(e) => setShowBoxplotMedians(e.target.checked)}
                      style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                    />
                    <label style={{ fontSize: '0.9rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600, cursor: 'pointer' }}>
                      Afficher les médianes
                    </label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={showBoxplotTrend}
                      onChange={(e) => setShowBoxplotTrend(e.target.checked)}
                      style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                    />
                    <label style={{ fontSize: '0.9rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600, cursor: 'pointer' }}>
                      Afficher la tendance
                    </label>
                  </div>
                </div>
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'rgba(224, 230, 237, 0.7)', fontWeight: 500 }}>
                    Regroupement:
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem', color: 'rgba(224, 230, 237, 0.9)' }}>
                    <input
                      type="radio"
                      name="boxplotGrouping"
                      value="monthly"
                      checked={boxplotGrouping === 'monthly'}
                      onChange={(e) => setBoxplotGrouping(e.target.value)}
                      style={{ marginRight: '0.3rem' }}
                    />
                    Mensuel
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem', color: 'rgba(224, 230, 237, 0.9)' }}>
                    <input
                      type="radio"
                      name="boxplotGrouping"
                      value="quarterly"
                      checked={boxplotGrouping === 'quarterly'}
                      onChange={(e) => setBoxplotGrouping(e.target.value)}
                      style={{ marginRight: '0.3rem' }}
                    />
                    Trimestriel
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem', color: 'rgba(224, 230, 237, 0.9)' }}>
                    <input
                      type="radio"
                      name="boxplotGrouping"
                      value="yearly"
                      checked={boxplotGrouping === 'yearly'}
                      onChange={(e) => setBoxplotGrouping(e.target.value)}
                      style={{ marginRight: '0.3rem' }}
                    />
                    Annuel
                  </label>
                </div>
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', paddingLeft: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={boxplotViolinUseGradient}
                    onChange={(e) => setBoxplotViolinUseGradient(e.target.checked)}
                    style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                  />
                  <label style={{ fontSize: '0.85rem', color: 'rgba(224, 230, 237, 0.9)', cursor: 'pointer' }}>
                    Gradient couleur (14-24)
                  </label>
                </div>
                {showBoxplot && (
                <div style={{
                  width: '100%',
                  overflowX: 'auto',
                  marginBottom: '1rem'
                }}>
                  <div style={{ width: '100%', minWidth: '1400px', height: '700px' }}>
                    <svg width="100%" height="100%" viewBox="0 0 1100 700">
                      {boxplotData.map((box, idx) => {
                        const leftMargin = 120; // Marge gauche pour dégager l'axe Y
                        const plotWidth = 1100 - leftMargin;
                        const spacing = plotWidth / (boxplotData.length + 1);
                        const centerX = leftMargin + spacing * (idx + 1);
                        const boxWidth = spacing * 0.6;

                        // If month is empty, just show the label
                        if (box.isEmpty) {
                          return (
                            <g key={idx}>
                              {/* Month label only */}
                              <text
                                x={centerX}
                                y={630}
                                textAnchor="middle"
                                fill="rgba(224, 230, 237, 0.4)"
                                fontSize="11"
                                transform={`rotate(-45 ${centerX} 630)`}
                              >
                                {box.month}
                              </text>
                            </g>
                          );
                        }

                        let yMin, yMax;
                        if (boxplotYLimits.enabled && boxplotYLimits.min !== '' && boxplotYLimits.max !== '') {
                          yMin = parseFloat(boxplotYLimits.min);
                          yMax = parseFloat(boxplotYLimits.max);
                        } else {
                          const allValues = boxplotData.flatMap(b => !b.isEmpty ? [b.min, b.max] : []);
                          if (allValues.length === 0) return null;
                          yMin = Math.min(...allValues);
                          yMax = Math.max(...allValues);
                        }
                        const yRange = yMax - yMin || 1;
                        const yScale = 460 / yRange;

                        const getY = (value) => 530 - ((value - yMin) * yScale);

  // const minY = getY(box.min);
                        const p5Y = getY(box.p5);
                        const q1Y = getY(box.q1);
                        const medianY = getY(box.median);
                        const q3Y = getY(box.q3);
                        const p95Y = getY(box.p95);
  // const maxY = getY(box.max);

                        if (boxplotType === 'boxplot') return (
                          <g key={idx}>
                            {/* Whiskers P5-P95 */}
                            <line x1={centerX} y1={p5Y} x2={centerX} y2={p95Y} stroke="rgba(0, 255, 170, 0.8)" strokeWidth={2} />
                            <line x1={centerX - 3} y1={p5Y} x2={centerX + 3} y2={p5Y} stroke="rgba(0, 255, 170, 0.8)" strokeWidth={2} />
                            <line x1={centerX - 3} y1={p95Y} x2={centerX + 3} y2={p95Y} stroke="rgba(0, 255, 170, 0.8)" strokeWidth={2} />

                            {/* Box Q1-Q3 */}
                            <rect
                              x={centerX - boxWidth / 2}
                              y={q3Y}
                              width={boxWidth}
                              height={Math.max(1, q1Y - q3Y)}
                              fill={boxplotViolinUseGradient ? getColorFromValue(box.median) : '#00ffaa'}
                              stroke="rgba(0, 0, 0, 0.5)"
                              strokeWidth={1.5}
                              opacity={0.8}
                            />

                            {/* Median line */}
                            <line x1={centerX - boxWidth / 2} y1={medianY} x2={centerX + boxWidth / 2} y2={medianY} stroke="#FFD700" strokeWidth={4} />

                            {/* Median value label - conditionally displayed */}
                            {showBoxplotMedians && (
                              <>
                                <rect
                                  x={centerX + boxWidth / 2 + 3}
                                  y={medianY - 9}
                                  width={48}
                                  height={18}
                                  fill="rgba(10, 14, 39, 0.9)"
                                  stroke="#FFD700"
                                  strokeWidth={1}
                                  rx={2}
                                />
                                <text
                                  x={centerX + boxWidth / 2 + 27}
                                  y={medianY + 4}
                                  textAnchor="middle"
                                  fill="#FFD700"
                                  fontSize="12"
                                  fontWeight="700"
                                >
                                  {box.median.toFixed(2)}
                                </text>
                              </>
                            )}

                            {/* Month label */}
                            <text
                              x={centerX}
                              y={630}
                              textAnchor="middle"
                              fill="rgba(224, 230, 237, 0.7)"
                              fontSize="11"
                              transform={`rotate(-45 ${centerX} 630)`}
                            >
                              {box.month}
                            </text>

                            {/* Hover area for tooltip */}
                            <rect
                              x={centerX - boxWidth / 2}
                              y={Math.min(p95Y, 50)}
                              width={boxWidth}
                              height={Math.max(p5Y, 530) - Math.min(p95Y, 50)}
                              fill="transparent"
                              style={{ cursor: 'pointer' }}
                            >
                              <title>
                                {`${box.month}\nMax: ${box.max.toFixed(3)}\nP95: ${box.p95.toFixed(3)}\nQ3: ${box.q3.toFixed(3)}\nMédiane: ${box.median.toFixed(3)}\nQ1: ${box.q1.toFixed(3)}\nP5: ${box.p5.toFixed(3)}\nMin: ${box.min.toFixed(3)}\nn = ${box.count.toLocaleString('fr-FR')}`}
                              </title>
                            </rect>
                          </g>
                        );

                        // v5.5 — VIOLIN PLOT
                        if (boxplotType === 'violin') {
                          const dist = distributionData.find(d => d.month === box.month);
                          if (!dist || dist.isEmpty) return (
                            <g key={idx}>
                              <text x={centerX} y={630} textAnchor="middle" fill="rgba(224, 230, 237, 0.4)" fontSize="11" transform={`rotate(-45 ${centerX} 630)`}>{box.month}</text>
                            </g>
                          );

                          const maxW = boxWidth * 0.7;
                          const leftPts = [], rightPts = [];
                          dist.density.forEach(p => {
                            const y = getY(p.x);
                            const w = p.density * maxW;
                            leftPts.push(`${centerX - w},${y}`);
                            rightPts.push(`${centerX + w},${y}`);
                          });

                          const leftPath  = 'M ' + leftPts.join(' L ');
                          const rightPath = 'M ' + rightPts.join(' L ');
                          const closed    = leftPath + ' L ' + rightPts[rightPts.length - 1] + ' ' + rightPts.slice().reverse().join(' L ') + ' Z';
                          const col       = boxplotViolinUseGradient ? getColorFromValue(dist.median) : '#00ffaa';

                          return (
                            <g key={idx}>
                              <path d={closed}     fill={col}  stroke="none" opacity={0.45} />
                              <path d={leftPath}   fill="none" stroke={col}  strokeWidth={2.2} opacity={0.9} />
                              <path d={rightPath}  fill="none" stroke={col}  strokeWidth={2.2} opacity={0.9} />
                              <line x1={centerX - 5} y1={getY(dist.q1)} x2={centerX + 5} y2={getY(dist.q1)} stroke="rgba(255,255,255,0.75)" strokeWidth={2.5} />
                              <line x1={centerX - 5} y1={getY(dist.q3)} x2={centerX + 5} y2={getY(dist.q3)} stroke="rgba(255,255,255,0.75)" strokeWidth={2.5} />
                              {/* Médiane : ligne horizontale + cercle plus visible */}
                              <line x1={centerX - 8} y1={getY(dist.median)} x2={centerX + 8} y2={getY(dist.median)} stroke="#FFD700" strokeWidth={3} />
                              <circle cx={centerX} cy={getY(dist.median)} r={5} fill="#FFD700" stroke="rgba(0,0,0,0.8)" strokeWidth={2} />
                              
                              {/* Median value label - same as boxplot */}
                              {showBoxplotMedians && (
                                <>
                                  <rect
                                    x={centerX + boxWidth / 2 + 3}
                                    y={getY(dist.median) - 9}
                                    width={48}
                                    height={18}
                                    fill="rgba(10, 14, 39, 0.9)"
                                    stroke="#FFD700"
                                    strokeWidth={1}
                                    rx={2}
                                  />
                                  <text
                                    x={centerX + boxWidth / 2 + 27}
                                    y={getY(dist.median) + 4}
                                    textAnchor="middle"
                                    fill="#FFD700"
                                    fontSize="12"
                                    fontWeight="700"
                                  >
                                    {dist.median.toFixed(2)}
                                  </text>
                                </>
                              )}
                              
                              <text x={centerX} y={630} textAnchor="middle" fill="rgba(224, 230, 237, 0.7)" fontSize="11" transform={`rotate(-45 ${centerX} 630)`}>{box.month}</text>
                              {/* Violin hover tooltip */}
                              <rect
                                x={centerX - boxWidth / 2}
                                y={Math.min(getY(box.p95), 50)}
                                width={boxWidth}
                                height={Math.max(getY(box.p5), 530) - Math.min(getY(box.p95), 50)}
                                fill="transparent"
                                style={{ cursor: 'pointer' }}
                              >
                                <title>
                                  {`${box.month}\nMax: ${box.max.toFixed(3)}\nP95: ${box.p95.toFixed(3)}\nQ3: ${dist.q3.toFixed(3)}\nMédiane: ${dist.median.toFixed(3)}\nQ1: ${dist.q1.toFixed(3)}\nP5: ${box.p5.toFixed(3)}\nMin: ${box.min.toFixed(3)}\nn = ${box.count.toLocaleString('fr-FR')}`}
                                </title>
                              </rect>
                            </g>
                          );
                        }

                        return null;
                      })}

                      {/* Y axis labels */}
                      {(() => {
                        let yMin, yMax;
                        if (boxplotYLimits.enabled && boxplotYLimits.min !== '' && boxplotYLimits.max !== '') {
                          yMin = parseFloat(boxplotYLimits.min);
                          yMax = parseFloat(boxplotYLimits.max);
                        } else {
                          const allValues = boxplotData.flatMap(b => [b.min, b.max]);
                          yMin = Math.min(...allValues);
                          yMax = Math.max(...allValues);
                        }
                        const yRange = yMax - yMin || 1;

                        return [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => {
                          const value = yMin + (yRange * i / 8);
                          const y = 530 - (i * 57.5);
                          return (
                            <text
                              key={`ylabel-${i}`}
                              x={50}
                              y={y + 5}
                              textAnchor="end"
                              fill="rgba(224, 230, 237, 0.7)"
                              fontSize="11"
                            >
                              {value.toFixed(2)}
                            </text>
                          );
                        });
                      })()}

                      {/* Trend line - régression linéaire */}
                      {showBoxplotTrend && (() => {
                        const trendPoints = [];
                        const leftMargin = 120;
                        const plotWidth = 1100 - leftMargin;
                        const spacing = plotWidth / (boxplotData.length + 1);
                        
                        let yMin, yMax;
                        if (boxplotYLimits.enabled && boxplotYLimits.min !== '' && boxplotYLimits.max !== '') {
                          yMin = parseFloat(boxplotYLimits.min);
                          yMax = parseFloat(boxplotYLimits.max);
                        } else {
                          const allValues = boxplotData.flatMap(b => !b.isEmpty ? [b.min, b.max] : []);
                          if (allValues.length === 0) return null;
                          yMin = Math.min(...allValues);
                          yMax = Math.max(...allValues);
                        }
                        const yRange = yMax - yMin || 1;
                        const yScale = 460 / yRange;
                        const getY = (value) => 530 - ((value - yMin) * yScale);
                        
                        // Collecter les points médians pour la tendance
                        boxplotData.forEach((box, idx) => {
                          if (!box.isEmpty) {
                            const centerX = leftMargin + spacing * (idx + 1);
                            const medianY = getY(box.median);
                            trendPoints.push({ x: centerX, y: medianY });
                          }
                        });
                        
                        if (trendPoints.length < 2) return null;
                        
                        // Calculer la régression linéaire
                        const trendLine = getLinearTrendLine(trendPoints);
                        
                        if (!trendLine) return null;
                        
                        return (
                          <line
                            x1={trendLine.x1}
                            y1={trendLine.y1}
                            x2={trendLine.x2}
                            y2={trendLine.y2}
                            stroke="#FF6B9D"
                            strokeWidth={2.5}
                            opacity={0.8}
                          />
                        );
                      })()}


                      {/* Lignes verticales entre années (décembre → janvier) */}
                      {(() => {
                        const leftMargin = 120;
                        const plotWidth = 1100 - leftMargin;
                        const spacing = plotWidth / (boxplotData.length + 1);
                        const lines = [];
                        
                        for (let i = 1; i < boxplotData.length; i++) {
                          const prevMonth = boxplotData[i - 1].month;
                          const currMonth = boxplotData[i].month;
                          
                          // Détecter transition décembre → janvier
                          if (prevMonth.endsWith('-12') && currMonth.endsWith('-01')) {
                            const x = leftMargin + spacing * (i + 0.5); // Entre les deux mois
                            lines.push(
                              <line key={`year-${i}`} x1={x} y1={70} x2={x} y2={530} stroke="rgba(255, 200, 100, 0.4)" strokeWidth={2} strokeDasharray="4,4" />
                            );
                          }
                        }
                        return lines;
                      })()}

                      {/* Infos tendance */}
                      {showBoxplotTrend && (() => {
                        // Fonction pour convertir une période en nombre de mois depuis l'an 2000
                        const periodToMonths = (period) => {
                          if (boxplotGrouping === 'yearly') {
                            // Format: "2024" → mois depuis 2000
                            const year = parseInt(period, 10);
                            return (year - 2000) * 12;
                          } else if (boxplotGrouping === 'quarterly') {
                            // Format: "2024-Q3" → mois depuis 2000
                            const [year, q] = period.split('-Q');
                            const yearNum = parseInt(year, 10);
                            const quarterNum = parseInt(q, 10);
                            return (yearNum - 2000) * 12 + (quarterNum - 1) * 3;
                          } else { // monthly
                            // Format: "2024-08" → mois depuis 2000
                            const [year, month] = period.split('-').map(Number);
                            return (year - 2000) * 12 + (month - 1);
                          }
                        };
                        
                        // Calculer régression avec le temps réel en mois
                        const valuePoints = [];
                        boxplotData.forEach((box, idx) => {
                          if (!box.isEmpty) {
                            const monthsFromRef = periodToMonths(box.month);
                            valuePoints.push({ x: monthsFromRef, y: box.median });
                          }
                        });
                        
                        if (valuePoints.length < 2) return null;
                        
                        // Régression linéaire
                        const n = valuePoints.length;
                        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
                        for (let i = 0; i < n; i++) {
                          sumX += valuePoints[i].x;
                          sumY += valuePoints[i].y;
                          sumXY += valuePoints[i].x * valuePoints[i].y;
                          sumX2 += valuePoints[i].x * valuePoints[i].x;
  // sumY2 += valuePoints[i].y * valuePoints[i].y;
                        }
                        
                        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
                        const intercept = (sumY - slope * sumX) / n;
                        
                        // Calculer R² (coefficient de détermination)
                        const meanY = sumY / n;
                        let ssRes = 0, ssTot = 0;
                        for (let i = 0; i < n; i++) {
                          const predicted = slope * valuePoints[i].x + intercept;
                          ssRes += Math.pow(valuePoints[i].y - predicted, 2);
                          ssTot += Math.pow(valuePoints[i].y - meanY, 2);
                        }
                        const r2 = ssTot > 0 ? 1 - (ssRes / ssTot) : 0;
                        
                        // La pente est maintenant en unités/mois (temps réel)
                        const slopePerYear = slope * 12;
                        const sign = slopePerYear >= 0 ? '+' : '';
                        
                        return (
                          <g>
                            {/* Fond semi-transparent pour le texte - déplacé en haut à gauche */}
                            <rect x={120} y={20} width={155} height={65} fill="rgba(20, 25, 45, 0.92)" stroke="rgba(255, 107, 157, 0.5)" strokeWidth={1.5} rx={4} />
                            <text x={197} y={38} textAnchor="middle" fill="rgba(255, 107, 157, 0.95)" fontSize="11" fontWeight="700">
                              Tendance
                            </text>
                            <text x={197} y={57} textAnchor="middle" fill="rgba(224, 230, 237, 0.9)" fontSize="11" fontWeight="600">
                              {sign}{slopePerYear.toFixed(3)} /an
                            </text>
                            <text x={197} y={75} textAnchor="middle" fill="rgba(224, 230, 237, 0.75)" fontSize="9">
                              R² = {r2.toFixed(4)}
                            </text>
                          </g>
                        );
                      })()}

                                            {/* Legend */}
                      <g transform="translate(950, 20)">
                        <text x={0} y={0} fill="rgba(224, 230, 237, 0.8)" fontSize="11" fontWeight="600">
                          Légende:
                        </text>
                        <line x1={0} y1={15} x2={20} y2={15} stroke="#FFD700" strokeWidth={4} />
                        <text x={25} y={19} fill="rgba(224, 230, 237, 0.7)" fontSize="10">
                          Médiane
                        </text>
                        <rect x={0} y={25} width={20} height={15} fill="rgba(0, 255, 170, 0.3)" stroke="rgba(0, 255, 170, 0.8)" strokeWidth={2} />
                        <text x={25} y={37} fill="rgba(224, 230, 237, 0.7)" fontSize="10">
                          Q1-Q3 (50%)
                        </text>
                        <line x1={10} y1={50} x2={10} y2={65} stroke="rgba(0, 255, 170, 0.8)" strokeWidth={2} />
                        <text x={25} y={60} fill="rgba(224, 230, 237, 0.7)" fontSize="10">
                          P5-P95 (90%)
                        </text>
                        <line x1={0} y1={70} x2={20} y2={70} stroke="#FF6B9D" strokeWidth={2} strokeDasharray="3,3" />
                        <text x={25} y={74} fill="rgba(224, 230, 237, 0.7)" fontSize="10">
                          Tendance
                        </text>
                      </g>
                    </svg>
                  </div>
                </div>

                )}

                {/* Y-axis controls for boxplot */}
                <div style={{
                  background: 'rgba(20, 25, 45, 0.5)',
                  padding: '1rem',
                  borderRadius: '4px',
                  marginTop: '1rem',
                  borderLeft: '3px solid rgba(255, 200, 0, 0.5)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={boxplotYLimits.enabled}
                      onChange={(e) => setBoxplotYLimits(prev => ({ ...prev, enabled: e.target.checked }))}
                      style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                    />
                    <label style={{ fontSize: '0.9rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600 }}>
                      Limites Y manuelles (Boxplot)
                    </label>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.6)', display: 'block', marginBottom: '0.25rem' }}>
                        Y Min
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={boxplotYLimits.min}
                        onChange={(e) => setBoxplotYLimits(prev => ({ ...prev, min: e.target.value }))}
                        disabled={!boxplotYLimits.enabled}
                        placeholder="Auto"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.6)', display: 'block', marginBottom: '0.25rem' }}>
                        Y Max
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={boxplotYLimits.max}
                        onChange={(e) => setBoxplotYLimits(prev => ({ ...prev, max: e.target.value }))}
                        disabled={!boxplotYLimits.enabled}
                        placeholder="Auto"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* v5.5: Ridgeline Plot */}
            {stats && distributionData.length > 0 && (
              <div style={{
                background: 'rgba(20, 25, 45, 0.5)',
                border: '1px solid rgba(0, 255, 170, 0.2)',
                padding: '1.5rem',
                borderRadius: '4px',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h2 style={{ fontSize: '1.1rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600, margin: 0 }}>
                    ⛰️ Ridgeline Plot : {selectedColumn}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={showRidgeline} onChange={(e) => setShowRidgeline(e.target.checked)} style={{ cursor: 'pointer' }} />
                      <span style={{ fontSize: '0.85rem', color: 'rgba(224, 230, 237, 0.85)' }}>Afficher</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={ridgelineShowEmpty}
                        onChange={(e) => setRidgelineShowEmpty(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.85rem', color: 'rgba(224, 230, 237, 0.85)' }}>Afficher périodes vides</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={ridgelineUseGradient}
                        onChange={(e) => setRidgelineUseGradient(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.85rem', color: 'rgba(224, 230, 237, 0.85)' }}>Gradient couleur (14-24)</span>
                    </label>
                    {showRidgeline && (
                      <button onClick={() => {
                        const svg = ridgelineSvgRef.current;
                        if (!svg) return;
                        const serializer = new XMLSerializer();
                        let svgStr = serializer.serializeToString(svg);
                        // Ajouter xmlns si absent pour compatibilité
                        if (!svgStr.includes('xmlns=')) {
                          svgStr = svgStr.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
                        }
                        const w = 1100, h = parseInt(svg.getAttribute('height')) || 600;
                        const canvas = document.createElement('canvas');
                        canvas.width = w * 2;
                        canvas.height = h * 2;
                        const ctx = canvas.getContext('2d');
                        ctx.scale(2, 2);
                        ctx.fillStyle = '#0a0e27';
                        ctx.fillRect(0, 0, w, h);
                        const img = new Image();
                        // Utiliser data:URL (blob URL bloqué pour drawImage avec SVG)
                        const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          img.onload = () => {
                            ctx.drawImage(img, 0, 0, w, h);
                            canvas.toBlob((pngBlob) => {
                              if (!pngBlob) return;
                              const pngUrl = URL.createObjectURL(pngBlob);
                              const link = document.createElement('a');
                              link.download = `ridgeline-${new Date().toISOString().split('T')[0]}.png`;
                              link.href = pngUrl;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              URL.revokeObjectURL(pngUrl);
                            });
                          };
                          img.src = reader.result;
                        };
                        reader.readAsDataURL(svgBlob);
                      }}
                      style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', background: 'rgba(0, 255, 170, 0.2)', border: '1px solid rgba(0, 255, 170, 0.3)', color: 'rgba(224, 230, 237, 0.9)', cursor: 'pointer', borderRadius: '4px' }}>
                        📥 Exporter PNG
                      </button>
                    )}
                  </div>
                </div>

                {showRidgeline && (() => {
                  // v6.0: Filtrer selon le toggle showEmpty
                  const displayData = ridgelineShowEmpty ? distributionData : distributionData.filter(d => !d.isEmpty);
                  if (displayData.length === 0) return null;
                  
                  // v6.0: Vrai zoom - recalcule l'échelle X selon les limites
                  const zoomMin = ridgelineMsasLimits.enabled && ridgelineMsasLimits.min !== '' ? parseFloat(ridgelineMsasLimits.min) : 14;
                  const zoomMax = ridgelineMsasLimits.enabled && ridgelineMsasLimits.max !== '' ? parseFloat(ridgelineMsasLimits.max) : 24;
                  
                  // Échelle X : mappe [zoomMin, zoomMax] sur [140, 960] (toute la largeur)
                  const leftMargin = 140;
                  const rightMargin = 960;
                  const xRange = zoomMax - zoomMin;
                  const getX = v => leftMargin + ((v - zoomMin) / xRange) * (rightMargin - leftMargin);
                  
                  // Calculer globalMaxDensity seulement sur les distributions avec données
                  const withData = displayData.filter(d => !d.isEmpty && d.rawDensity && d.rawDensity.length > 0);
                  const globalMaxDensity = withData.length > 0 
                    ? Math.max(...withData.map(d => Math.max(...d.rawDensity.map(p => p.density))))
                    : 1; // Valeur par défaut si aucune donnée
                  const ridgeH = ridgelineHeight; // v6.0: Contrôlable par l'utilisateur
                  const rowH = ridgelineSpacing; // v6.0: Contrôlable par l'utilisateur
                  const topPad = 100; // v6.0: Augmenté de 55 → 100 pour éviter le dépassement
                  const svgH = topPad + displayData.length * rowH + 30;

                  const vbX = leftMargin;
                  const vbW = rightMargin - leftMargin;
                  const titleX = leftMargin + vbW / 2;

                  return (
                    <div style={{ overflowY: 'auto', maxHeight: '1200px' }}>
                      <svg ref={ridgelineSvgRef} style={{ width: '100%', maxWidth: '1100px' }} height={svgH} viewBox={`${vbX} 0 ${vbW} ${svgH}`} preserveAspectRatio="xMidYMid meet">
                        <defs>
                          <linearGradient id="msasGrad" x1="140" y1="0" x2="960" y2="0" gradientUnits="userSpaceOnUse">
                            {/* Gradient adapté au zoom */}
                            {Array.from({ length: 11 }, (_, i) => {
                              const v = zoomMin + (i / 10) * (zoomMax - zoomMin);
                              return <stop key={i} offset={`${i * 10}%`} stopColor={getColorFromValue(v)} />;
                            })}
                          </linearGradient>
                        </defs>

                        {/* Titre — centré sur la vue */}
                        <text x={titleX} y={16} textAnchor="middle" fill="rgba(224,230,237,0.95)" fontSize="13" fontWeight="700">
                          MSAS (Magnitude par seconde d'arc carré)
                        </text>
                        {/* Axe horizontal — s'étend sur toute la vue */}
                        <line x1={vbX} y1={42} x2={vbX + vbW} y2={42} stroke="rgba(224,230,237,0.35)" strokeWidth={1.5} />
                        {/* Ticks : adaptés au zoom */}
                        {(() => {
                          const range = zoomMax - zoomMin;
                          // Espacement intelligent : 0.5 si range < 3, 1.0 si range < 8, 2.0 sinon
                          const step = range < 3 ? 0.5 : range < 8 ? 1.0 : 2.0;
                          const ticks = [];
                          for (let v = Math.ceil(zoomMin / step) * step; v <= zoomMax; v += step) {
                            ticks.push(v);
                          }
                          return ticks.map(v => {
                            const x = getX(v);
                            const major = v % 1 === 0; // Entiers en gras
                            return (
                              <g key={v}>
                                <line x1={x} y1={major ? 36 : 38} x2={x} y2={42} stroke="rgba(224,230,237,0.45)" strokeWidth={major ? 1.5 : 0.8} />
                                <text x={x} y={33} textAnchor="middle" fill={major ? 'rgba(224,230,237,0.85)' : 'rgba(224,230,237,0.45)'} fontSize={major ? '11' : '9.5'} fontWeight={major ? '600' : '400'}>
                                  {v.toFixed(v % 1 === 0 ? 0 : 1)}
                                </text>
                              </g>
                            );
                          });
                        })()}

                        {/* Courbes — premiers mois en haut */}
                        {displayData.map((dist, idx) => {
                          const baseY = topPad + idx * rowH;
                          
                          // Gérer les périodes vides
                          if (dist.isEmpty || !dist.rawDensity || dist.rawDensity.length === 0) {
                            return (
                              <g key={dist.month}>
                                {/* Ligne de base pour période vide */}
                                <line x1={leftMargin} y1={baseY} x2={rightMargin} y2={baseY} stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="4,4" />
                                <text x={125} y={baseY - 2} textAnchor="end" fill="rgba(224,230,237,0.4)" fontSize="10.5" fontWeight="600">{dist.month}</text>
                                <text x={leftMargin + 10} y={baseY - 2} textAnchor="start" fill="rgba(224,230,237,0.3)" fontSize="9" fontStyle="italic">Aucune donnée</text>
                              </g>
                            );
                          }
                          
                          // Période avec données
                          const pts = dist.rawDensity.map(p => `${getX(p.x)},${baseY - (p.density / globalMaxDensity) * ridgeH}`);
                          const firstX = getX(dist.rawDensity[0].x);
                          const lastX  = getX(dist.rawDensity[dist.rawDensity.length - 1].x);
                          const path = `M ${firstX},${baseY} L ` + pts.join(' L ') + ` L ${lastX},${baseY} Z`;

                          return (
                            <g key={dist.month}>
                              <path d={path} fill={ridgelineUseGradient ? "url(#msasGrad)" : "rgba(0, 255, 170, 0.4)"} stroke="rgba(255,255,255,0.25)" strokeWidth={1} opacity={0.88} />
                              <text x={125} y={baseY - 2} textAnchor="end" fill="rgba(224,230,237,0.9)" fontSize="10.5" fontWeight="600">{dist.month}</text>
                              <circle cx={getX(dist.median)} cy={baseY - 4} r={3} fill="#FFD700" stroke="rgba(0,0,0,0.6)" strokeWidth={1.2} />
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  );
                })()}

                {/* v6.0: Contrôles espacement et hauteur ridgeline */}
                <div style={{
                  background: 'rgba(20, 25, 45, 0.5)',
                  padding: '0.75rem 1rem',
                  borderRadius: '4px',
                  marginTop: '0.75rem',
                  borderLeft: '3px solid rgba(0, 255, 170, 0.4)'
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600, marginBottom: '0.75rem' }}>
                    ⚙️ Contrôles d'affichage
                  </div>
                  <div style={{ display: 'flex', gap: '2rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.7)', marginBottom: '0.3rem' }}>
                        Espacement vertical (px): {ridgelineSpacing}
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="120"
                        step="10"
                        value={ridgelineSpacing}
                        onChange={(e) => setRidgelineSpacing(parseInt(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'rgba(224, 230, 237, 0.4)', marginTop: '0.15rem' }}>
                        <span>Serré (20)</span>
                        <span>Large (120)</span>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.7)', marginBottom: '0.3rem' }}>
                        Hauteur des courbes (px): {ridgelineHeight}
                      </label>
                      <input
                        type="range"
                        min="40"
                        max="200"
                        step="10"
                        value={ridgelineHeight}
                        onChange={(e) => setRidgelineHeight(parseInt(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'rgba(224, 230, 237, 0.4)', marginTop: '0.15rem' }}>
                        <span>Petites (40)</span>
                        <span>Grandes (200)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Limites MSAS manuelles pour le ridgeline */}
                <div style={{
                  background: 'rgba(20, 25, 45, 0.5)',
                  padding: '0.75rem 1rem',
                  borderRadius: '4px',
                  marginTop: '0.75rem',
                  borderLeft: '3px solid rgba(0, 255, 170, 0.4)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={ridgelineMsasLimits.enabled}
                      onChange={(e) => setRidgelineMsasLimits(prev => ({ ...prev, enabled: e.target.checked }))}
                      style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                    />
                    <label style={{ fontSize: '0.85rem', color: 'rgba(224, 230, 237, 0.9)', fontWeight: 600 }}>
                      Limites MSAS manuelles (zoom)
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.6)' }}>Min</label>
                      <input
                        type="number"
                        step="0.5"
                        min="10"
                        max="24"
                        value={ridgelineMsasLimits.min}
                        onChange={(e) => setRidgelineMsasLimits(prev => ({ ...prev, min: e.target.value }))}
                        disabled={!ridgelineMsasLimits.enabled}
                        style={{ width: '60px', padding: '0.25rem 0.4rem', background: 'rgba(30,35,60,0.8)', border: '1px solid rgba(0,255,170,0.25)', borderRadius: '3px', color: 'rgba(224,230,237,0.9)', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.75rem', color: 'rgba(224, 230, 237, 0.6)' }}>Max</label>
                      <input
                        type="number"
                        step="0.5"
                        min="14"
                        max="28"
                        value={ridgelineMsasLimits.max}
                        onChange={(e) => setRidgelineMsasLimits(prev => ({ ...prev, max: e.target.value }))}
                        disabled={!ridgelineMsasLimits.enabled}
                        style={{ width: '60px', padding: '0.25rem 0.4rem', background: 'rgba(30,35,60,0.8)', border: '1px solid rgba(0,255,170,0.25)', borderRadius: '3px', color: 'rgba(224,230,237,0.9)', fontSize: '0.8rem' }}
                      />
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(224,230,237,0.4)', marginLeft: '0.5rem' }}>
                      Gradient toujours ancrée sur 14–24 MSAS
                    </span>
                  </div>
                </div>

              </div>
            )}

            {!stats && filteredData.length > 0 && (
              <div style={{
                background: 'rgba(255, 200, 0, 0.1)',
                border: '1px solid rgba(255, 200, 0, 0.3)',
                padding: '2rem',
                borderRadius: '4px',
                textAlign: 'center',
                color: 'rgba(255, 200, 0, 0.9)'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
                <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  Aucune donnée numérique dans la colonne "{selectedColumn}"
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                  Sélectionnez une colonne contenant des valeurs numériques pour voir les statistiques
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DataAnalyzer;
