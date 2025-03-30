import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Download, 
  Calendar, 
  Filter, 
  AlertTriangle,
  InfoIcon,
  ArrowUpDown,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  FileText,
  CheckCircle
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, parseISO, subDays, isWithinInterval } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ScanResult {
  id: string;
  timestamp: string;
  detection_result: string;
  confidence: string;
}

interface TimeRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface ScanTypeData {
  name: string;
  value: number;
  color: string;
}

interface HistoricalData {
  label: string;
  scans: number;
  abnormal: number;
}

// New interface for trends data
interface TrendData {
  date: string;
  count: number;
}

const Reports = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>({
    from: undefined,
    to: undefined
  });
  const [scanTypeData, setScanTypeData] = useState<ScanTypeData[]>([
    { name: 'Normal', value: 0, color: '#10b981' },
    { name: 'Abnormal', value: 0, color: '#ef4444' },
  ]);
  const [scanHistoryData, setScanHistoryData] = useState<HistoricalData[]>([]);
  const [timeFilterType, setTimeFilterType] = useState<'all' | 'last30' | 'last90' | 'custom'>('all');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedChartView, setSelectedChartView] = useState<'overview' | 'trends' | 'details'>('overview');
  const [dailyTrendData, setDailyTrendData] = useState<TrendData[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchScanData();
  }, [timeFilterType, timeRange]);
  
  const fetchScanData = async () => {
    try {
      setIsLoading(true);
      
      // Get authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log("No authenticated user found");
        setIsLoading(false);
        return;
      }
      
      // Build query
      let query = supabase
        .from('scan_results')
        .select('id, timestamp, detection_result, confidence')
        .eq('user_id', user.id);
      
      // Apply time filters
      if (timeFilterType === 'last30') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.gte('timestamp', thirtyDaysAgo.toISOString());
      } else if (timeFilterType === 'last90') {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        query = query.gte('timestamp', ninetyDaysAgo.toISOString());
      } else if (timeFilterType === 'custom' && timeRange.from) {
        query = query.gte('timestamp', timeRange.from.toISOString());
        if (timeRange.to) {
          const endDate = new Date(timeRange.to);
          endDate.setHours(23, 59, 59, 999);
          query = query.lte('timestamp', endDate.toISOString());
        }
      }
      
      // Execute query
      const { data, error } = await query.order('timestamp', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setScanResults(data || []);
      
      // Process data for charts
      processDataForCharts(data || []);
      processDailyTrendData(data || []);
      
    } catch (error: any) {
      console.error("Error fetching scan data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load scan data",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const processDataForCharts = (data: ScanResult[]) => {
    // Calculate scan type distribution
    const normal = data.filter(scan => 
      scan.detection_result.toLowerCase() === 'normal'
    ).length;
    
    const abnormal = data.length - normal;
    
    setScanTypeData([
      { name: 'Normal', value: normal, color: '#10b981' },
      { name: 'Abnormal', value: abnormal, color: '#ef4444' },
    ]);
    
    // Create historical data
    const groupedByMonth: Record<string, { total: number, abnormal: number }> = {};
    
    // Default to last 6 months if we have fewer than 6 data points
    const historyMonths = 6;
    const today = new Date();
    
    // Initialize the last 6 months
    for (let i = 0; i < historyMonths; i++) {
      const date = new Date();
      date.setMonth(today.getMonth() - i);
      const monthKey = format(date, 'MMM yyyy');
      groupedByMonth[monthKey] = { total: 0, abnormal: 0 };
    }
    
    // Fill in actual data
    data.forEach(scan => {
      const date = new Date(scan.timestamp);
      const monthKey = format(date, 'MMM yyyy');
      
      if (!groupedByMonth[monthKey]) {
        groupedByMonth[monthKey] = { total: 0, abnormal: 0 };
      }
      
      groupedByMonth[monthKey].total++;
      
      if (scan.detection_result.toLowerCase() !== 'normal') {
        groupedByMonth[monthKey].abnormal++;
      }
    });
    
    // Convert to array and sort chronologically
    const historicalData = Object.entries(groupedByMonth)
      .map(([label, stats]) => ({
        label,
        scans: stats.total,
        abnormal: stats.abnormal
      }))
      .sort((a, b) => {
        // Sort by date (newest last)
        const dateA = new Date(a.label);
        const dateB = new Date(b.label);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-historyMonths); // Get only the last 6 months
    
    setScanHistoryData(historicalData);
  };
  
  // New function to process daily scan trends  
  const processDailyTrendData = (data: ScanResult[]) => {
    // Get only data from the last 30 days
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentData = data.filter(scan => new Date(scan.timestamp) >= thirtyDaysAgo);
    
    // Group by day
    const groupedByDay: Record<string, number> = {};
    
    // Initialize all days in the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = subDays(new Date(), i);
      const dayKey = format(date, 'MMM dd');
      groupedByDay[dayKey] = 0;
    }
    
    // Fill in actual data
    recentData.forEach(scan => {
      const date = new Date(scan.timestamp);
      const dayKey = format(date, 'MMM dd');
      
      if (groupedByDay[dayKey] !== undefined) {
        groupedByDay[dayKey]++;
      }
    });
    
    // Convert to array and sort chronologically
    const trendData = Object.entries(groupedByDay)
      .map(([date, count]) => ({
        date,
        count
      }))
      .sort((a, b) => {
        // Sort by date (oldest first)
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
    
    setDailyTrendData(trendData);
  };
  
  const handleExportData = async () => {
    try {
      setIsExporting(true);
      
      // Format data for export
      const exportData = scanResults.map(scan => ({
        Date: new Date(scan.timestamp).toLocaleDateString(),
        Result: scan.detection_result,
        Confidence: scan.confidence,
      }));
      
      // Convert to CSV
      const headers = Object.keys(exportData[0]).join(',');
      const rows = exportData.map(obj => Object.values(obj).join(',')).join('\n');
      const csv = `${headers}\n${rows}`;
      
      // Create and download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `scan_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Complete",
        description: "Your scan data has been exported successfully",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export scan data",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleTimeRangeChange = (range: 'all' | 'last30' | 'last90' | 'custom') => {
    setTimeFilterType(range);
    
    if (range !== 'custom') {
      setTimeRange({ from: undefined, to: undefined });
      setDatePickerOpen(false);
    } else {
      setDatePickerOpen(true);
    }
  };
  
  // Calculate additional metrics for the dashboard
  const metrics = useMemo(() => {
    if (scanResults.length === 0) return {
      totalScans: 0,
      averagePerWeek: 0,
      abnormalRate: 0,
      lastScanDate: 'N/A',
      recentTrend: 'stable'
    };
    
    const today = new Date();
    const oneWeekAgo = subDays(today, 7);
    const twoWeeksAgo = subDays(today, 14);
    
    // Get scans in the last week and two weeks ago
    const lastWeekScans = scanResults.filter(scan => 
      isWithinInterval(new Date(scan.timestamp), { start: oneWeekAgo, end: today })
    ).length;
    
    const previousWeekScans = scanResults.filter(scan => 
      isWithinInterval(new Date(scan.timestamp), { start: twoWeeksAgo, end: oneWeekAgo })
    ).length;
    
    let trend = 'stable';
    if (lastWeekScans > previousWeekScans * 1.1) trend = 'increasing';
    else if (lastWeekScans < previousWeekScans * 0.9) trend = 'decreasing';
    
    // Calculate average scans per week
    const firstScanDate = new Date(scanResults[scanResults.length - 1].timestamp);
    const totalDays = Math.max(1, Math.ceil((today.getTime() - firstScanDate.getTime()) / (1000 * 60 * 60 * 24)));
    const totalWeeks = Math.max(1, totalDays / 7);
    
    const abnormalCount = scanResults.filter(scan => 
      scan.detection_result.toLowerCase() !== 'normal'
    ).length;
    
    return {
      totalScans: scanResults.length,
      averagePerWeek: +(scanResults.length / totalWeeks).toFixed(1),
      abnormalRate: +((abnormalCount / scanResults.length) * 100).toFixed(1),
      lastScanDate: format(new Date(scanResults[0].timestamp), 'MMM d, yyyy'),
      recentTrend: trend
    };
  }, [scanResults]);
  
  // Get trend indicator color
  const getTrendColor = (trend: string) => {
    if (trend === 'increasing') return 'text-green-500';
    if (trend === 'decreasing') return 'text-red-500';
    return 'text-yellow-500';
  };

  // Get trend indicator icon
  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') return '↑';
    if (trend === 'decreasing') return '↓';
    return '→';
  };
  
  return (
    <div className="flex h-screen bg-gradient-to-br from-white to-cancer-blue/5 overflow-hidden">
      <DashboardSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-6">
          <div className="flex flex-col gap-8 max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-white rounded-xl border border-cancer-blue/10 shadow-sm p-6 relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold mb-2">
                      <span className="text-gradient bg-gradient-to-r from-cancer-blue to-cancer-purple bg-clip-text text-transparent">
                        Reports & Analytics
                      </span>
                    </h1>
                    <p className="text-gray-600">
                      View insights from your scan history.
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center">
                      <Calendar size={16} className="mr-2" />
                          {timeFilterType === 'all' ? 'All Time' : 
                           timeFilterType === 'last30' ? 'Last 30 Days' : 
                           timeFilterType === 'last90' ? 'Last 90 Days' : 'Custom Range'}
                    </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleTimeRangeChange('all')}>
                          All Time
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTimeRangeChange('last30')}>
                          Last 30 Days
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTimeRangeChange('last90')}>
                          Last 90 Days
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTimeRangeChange('custom')}>
                          Custom Range
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    {timeFilterType === 'custom' && (
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                    <Button variant="outline" className="flex items-center">
                            {timeRange.from ? (
                              timeRange.to ? (
                                `${format(timeRange.from, 'MMM d')} - ${format(timeRange.to, 'MMM d, yyyy')}`
                              ) : (
                                format(timeRange.from, 'MMM d, yyyy')
                              )
                            ) : (
                              "Select Dates"
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <CalendarComponent
                            mode="range"
                            selected={{
                              from: timeRange.from || undefined,
                              to: timeRange.to || undefined,
                            }}
                            onSelect={(range) => {
                              setTimeRange({
                                from: range?.from,
                                to: range?.to,
                              });
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                    
                    <Button 
                      variant="outline" 
                      className="flex items-center"
                      onClick={handleExportData}
                      disabled={isExporting || scanResults.length === 0}
                    >
                      {isExporting ? (
                        <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin mr-2"></div>
                      ) : (
                      <Download size={16} className="mr-2" />
                      )}
                      Export
                    </Button>
                  </div>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-cancer-blue/10 to-transparent opacity-60"></div>
                <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-cancer-purple/5 to-transparent"></div>
              </div>
            </motion.div>
            
            {isLoading ? (
              <div className="bg-white rounded-xl border border-cancer-blue/10 shadow-sm p-6 flex justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-t-cancer-blue border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500 animate-pulse">Analyzing your scan data...</p>
                </div>
              </div>
            ) : scanResults.length === 0 ? (
              <div className="bg-white rounded-xl border border-cancer-blue/10 shadow-sm p-6 py-12 text-center">
                <div className="flex justify-center mb-4">
                  <InfoIcon className="w-12 h-12 text-gray-300" />
                </div>
                <h2 className="text-lg font-semibold text-gray-700 mb-2">No Scan Data Available</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                  {timeFilterType === 'all' 
                    ? "You haven't performed any scans yet. Start by uploading a scan from the Scan Management page."
                    : "No scan data available for the selected time period. Try adjusting your filters or check back after performing more scans."}
                </p>
              </div>
            ) : (
              <>
                {/* Key metrics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="p-5 border border-cancer-blue/10 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Total Scans</p>
                          <p className="text-3xl font-bold bg-gradient-to-r from-cancer-blue to-cancer-teal bg-clip-text text-transparent">{metrics.totalScans}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-cancer-blue/10 flex items-center justify-center group-hover:bg-cancer-blue/20 transition-colors duration-300">
                          <FileText className="h-6 w-6 text-cancer-blue" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Lifetime total</p>
                      <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-cancer-blue/5 to-transparent opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
                    </Card>
                    
                    <Card className="p-5 border border-cancer-blue/10 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Weekly Average</p>
                          <p className="text-3xl font-bold text-cancer-purple">{metrics.averagePerWeek}</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-cancer-purple/10 flex items-center justify-center group-hover:bg-cancer-purple/20 transition-colors duration-300">
                          <BarChartIcon className="h-6 w-6 text-cancer-purple" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Scans per week</p>
                      <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-cancer-purple/5 to-transparent opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
                    </Card>
                    
                    <Card className="p-5 border border-cancer-blue/10 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Abnormal Rate</p>
                          <p className="text-3xl font-bold text-red-500">{metrics.abnormalRate}%</p>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors duration-300">
                          <AlertTriangle className="h-6 w-6 text-red-500" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Of total scans</p>
                      <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-red-100/20 to-transparent opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
                    </Card>
                    
                    <Card className="p-5 border border-cancer-blue/10 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group">
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Recent Trend</p>
                          <div className="flex items-center">
                            <span className={`text-2xl font-bold ${getTrendColor(metrics.recentTrend)}`}>
                              {getTrendIcon(metrics.recentTrend)}
                            </span>
                            <span className="text-lg ml-2 capitalize">{metrics.recentTrend}</span>
                          </div>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
                          <LineChartIcon className="h-6 w-6 text-blue-500" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Based on last 2 weeks</p>
                      <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-blue-100/20 to-transparent opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
                    </Card>
                  </div>
                </motion.div>
              
                {/* Chart tabs */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-xl border border-cancer-blue/10 shadow-sm p-6"
              >
                  <Tabs defaultValue="overview" className="w-full" onValueChange={(value) => setSelectedChartView(value as any)}>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <BarChartIcon className="h-5 w-5 text-cancer-purple" />
                        Visualization
                      </h2>
                      <TabsList className="grid grid-cols-3 w-auto">
                        <TabsTrigger value="overview" className="px-4">Overview</TabsTrigger>
                        <TabsTrigger value="trends" className="px-4">Trends</TabsTrigger>
                        <TabsTrigger value="details" className="px-4">Details</TabsTrigger>
                      </TabsList>
                    </div>
                    
                    <TabsContent value="overview" className="mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 h-80">
                          <h3 className="text-sm font-medium text-gray-700 mb-4">Scan Results Distribution</h3>
                          <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                      <Pie
                        data={scanTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                                outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                                label={({ name, percent }) => 
                                  `${name} ${(percent * 100).toFixed(0)}%`
                                }
                      >
                        {scanTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                              <Tooltip formatter={(value) => [`${value} Scans`, 'Count']} />
                              <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                        
                        <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 h-80">
                          <h3 className="text-sm font-medium text-gray-700 mb-4">Monthly Activity</h3>
                          <ResponsiveContainer width="100%" height="90%">
                    <BarChart
                      data={scanHistoryData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                              <Tooltip 
                                formatter={(value, name) => [
                                  `${value} Scans`, 
                                  name === 'scans' ? 'Total' : 'Abnormal'
                                ]}
                                contentStyle={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '6px', border: '1px solid #f0f0f0' }}
                              />
                              <Bar dataKey="scans" fill="#6366f1" name="Total Scans" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="abnormal" fill="#ef4444" name="Abnormal" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="trends" className="mt-4">
                      <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 h-80">
                        <h3 className="text-sm font-medium text-gray-700 mb-4">Daily Scan Activity (Last 30 Days)</h3>
                        <ResponsiveContainer width="100%" height="90%">
                          <AreaChart
                            data={dailyTrendData}
                            margin={{
                              top: 10,
                              right: 30,
                              left: 0,
                              bottom: 0,
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 12 }}
                              interval="preserveEnd"
                              tickFormatter={(value) => value.split(' ')[1]}
                            />
                            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                            <Tooltip
                              formatter={(value) => [`${value} Scans`, 'Count']}
                              contentStyle={{ background: 'rgba(255, 255, 255, 0.9)', borderRadius: '6px', border: '1px solid #f0f0f0' }}
                              labelFormatter={(label) => format(new Date(label), 'MMM dd, yyyy')}
                            />
                            <Area 
                              type="monotone" 
                              dataKey="count" 
                              name="Scans" 
                              stroke="#8b5cf6" 
                              fill="url(#colorGradient)"
                              activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                            <defs>
                              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="details" className="mt-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-sm font-medium text-gray-700">Recent Scan Results</h3>
                          <p className="text-xs text-gray-500">
                            Showing {Math.min(scanResults.length, 10)} of {scanResults.length} results
                          </p>
            </div>
            
                        <div className="overflow-hidden rounded-lg border border-gray-200">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Result
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Confidence
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {scanResults.slice(0, 10).map((scan) => (
                                <tr key={scan.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {new Date(scan.timestamp).toLocaleDateString('en-US', { 
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge
                                      className={`${
                                        scan.detection_result.toLowerCase() === 'normal'
                                          ? 'bg-green-100 hover:bg-green-200 text-green-800'
                                          : 'bg-red-100 hover:bg-red-200 text-red-800'
                                      }`}
                                    >
                                      {scan.detection_result.toLowerCase() === 'normal' ? (
                                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                      ) : (
                                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                                      )}
                                      {scan.detection_result}
                                    </Badge>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {scan.confidence}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
            </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
