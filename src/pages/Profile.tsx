import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User, Mail, Calendar, Edit, Save, X, Shield, FileText, Award, Zap, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ScanStats {
  total: number;
  normal: number;
  abnormal: number;
}

const Profile = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userData, setUserData] = useState({
    id: "",
    name: "",
    email: "",
    created_at: "",
  });
  const [editedUserData, setEditedUserData] = useState({
    name: "",
  });
  const [scanStats, setScanStats] = useState<ScanStats>({
    total: 0,
    normal: 0,
    abnormal: 0
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        // Get authenticated user data
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          setUserData({
            id: user.id,
            name: user.user_metadata?.full_name || "User",
            email: user.email || "",
            created_at: user.created_at || "",
          });
          
          setEditedUserData({
            name: user.user_metadata?.full_name || "User",
          });
          
          // Fetch scan statistics
          await fetchScanStatistics(user.id);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load user profile",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [toast]);
  
  const fetchScanStatistics = async (userId: string) => {
    try {
      // Fetch all scans for this user
      const { data: scanData, error } = await supabase
        .from('scan_results')
        .select('detection_result')
        .eq('user_id', userId);
      
      if (error) {
        throw error;
      }
      
      if (scanData) {
        const total = scanData.length;
        const normal = scanData.filter(scan => 
          scan.detection_result.toLowerCase() === 'normal'
        ).length;
        
        setScanStats({
          total,
          normal,
          abnormal: total - normal
        });
      }
    } catch (error) {
      console.error("Error fetching scan statistics:", error);
    }
  };
  
  const handleUpdateProfile = async () => {
    try {
      setIsUpdating(true);
      
      const { error } = await supabase.auth.updateUser({
        data: { full_name: editedUserData.name }
      });
      
      if (error) {
        throw error;
      }
      
      // Update local state with new data
      setUserData(prev => ({
        ...prev,
        name: editedUserData.name
      }));
      
      setIsEditDialogOpen(false);
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Failed to update profile",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate achievement badges based on scan counts
  const getAchievementLevel = () => {
    if (scanStats.total >= 50) return "Expert";
    if (scanStats.total >= 25) return "Advanced";
    if (scanStats.total >= 10) return "Intermediate";
    return "Beginner";
  };

  const calculateCompletionPercentage = () => {
    // Set arbitrary goals for "completion" - this can be adjusted based on app goals
    const targetScans = 50;
    return Math.min(Math.round((scanStats.total / targetScans) * 100), 100);
  };
  
  const completionPercentage = calculateCompletionPercentage();
  const achievementLevel = getAchievementLevel();
  
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
                <div className="relative z-10">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  <span className="text-gradient bg-gradient-to-r from-cancer-blue to-cancer-purple bg-clip-text text-transparent">
                    My Profile
                  </span>
                </h1>
                <p className="text-gray-600">
                    Manage your account details and view your scan statistics.
                </p>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-cancer-blue/10 to-transparent"></div>
                <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-gradient-to-br from-cancer-purple/5 to-transparent"></div>
              </div>
            </motion.div>
            
            {isLoading ? (
              <div className="bg-white rounded-xl border border-cancer-blue/10 shadow-sm p-6 flex justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-t-cancer-blue border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                  <p className="text-gray-500 animate-pulse">Loading your profile...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                    className="lg:col-span-2"
                >
                    <div className="bg-white rounded-xl border border-cancer-blue/10 shadow-sm p-6 h-full relative overflow-hidden group">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cancer-blue to-cancer-purple flex items-center justify-center text-white text-3xl font-bold shadow-lg group-hover:animate-pulse-glow transition-all duration-300">
                      {userData.name.charAt(0)}
                    </div>
                    
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-1">{userData.name}</h2>
                          <div className="flex items-center text-gray-500 mb-2">
                        <Mail className="w-4 h-4 mr-2" />
                        <span>{userData.email}</span>
                      </div>
                      
                          <div className="flex items-center text-gray-500 mb-3">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Member since {formatDate(userData.created_at)}</span>
                      </div>
                          
                          <div className="flex items-center">
                            <span className="text-sm bg-cancer-purple/10 text-cancer-purple px-3 py-1 rounded-full flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5" />
                              {achievementLevel} Scanner
                            </span>
                          </div>
                    </div>
                    
                        <Button 
                          variant="outline" 
                          className="flex items-center transition-all duration-300 hover:bg-cancer-blue/10 hover:text-cancer-blue hover:border-cancer-blue/30"
                          onClick={() => setIsEditDialogOpen(true)}
                        >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                      </div>
                      
                      <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-br from-cancer-blue/5 to-transparent opacity-70"></div>
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                    className="lg:col-span-1"
                  >
                    <div className="bg-white rounded-xl border border-cancer-blue/10 shadow-sm p-6 h-full relative overflow-hidden group">
                      <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-cancer-purple" />
                        Account Status
                      </h2>
                      
                      <div className="space-y-5">
                    <div>
                          <div className="flex justify-between mb-1">
                            <p className="text-sm text-gray-600">Profile Completion</p>
                            <p className="text-sm font-medium">{completionPercentage}%</p>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${completionPercentage}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className="h-full bg-gradient-to-r from-cancer-blue to-cancer-purple rounded-full"
                            />
                      </div>
                    </div>
                    
                    <div>
                          <div className="flex justify-between mb-1">
                            <p className="text-sm text-gray-600">Scans Progress</p>
                            <p className="text-sm font-medium">{scanStats.total} / 50</p>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(scanStats.total / 50 * 100, 100)}%` }}
                              transition={{ duration: 1, delay: 0.7 }}
                              className="h-full bg-gradient-to-r from-cancer-teal to-cancer-blue rounded-full"
                            />
                          </div>
                        </div>
                        
                        <div className="pt-4 mt-2 border-t border-gray-100">
                          <h3 className="text-sm font-medium text-gray-800 mb-3">Next Achievements:</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                              <Zap className="w-3.5 h-3.5 text-cancer-purple" />
                            </div>
                            <span>{scanStats.total >= 10 ? "✓" : ""} Complete 10 scans</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                              <Award className="w-3.5 h-3.5 text-cancer-blue" />
                            </div>
                            <span>{scanStats.total >= 25 ? "✓" : ""} Reach Advanced Scanner status</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-gradient-radial from-cancer-purple/10 to-transparent"></div>
                    </div>
                  </motion.div>
                  </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-white rounded-xl border border-cancer-blue/10 shadow-sm p-6 relative overflow-hidden"
                >
                  <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cancer-purple" />
                    Scan Statistics
                  </h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border border-gray-100 shadow-sm relative group hover:border-cancer-blue/20 transition-all duration-300">
                      <div className="absolute top-0 right-0 m-4 opacity-10 group-hover:opacity-30 transition-opacity duration-300">
                        <FileText className="w-10 h-10 text-cancer-blue" />
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Total Scans</p>
                      <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold bg-gradient-to-r from-cancer-blue to-cancer-teal bg-clip-text text-transparent">
                          {scanStats.total}
                        </p>
                        <p className="text-xs text-gray-500 mb-1">scans</p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500">Lifetime total</p>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border border-gray-100 shadow-sm relative group hover:border-green-300/30 transition-all duration-300">
                      <div className="absolute top-0 right-0 m-4 opacity-10 group-hover:opacity-30 transition-opacity duration-300">
                        <Shield className="w-10 h-10 text-green-500" />
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Normal Results</p>
                      <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-green-500">
                          {scanStats.normal}
                        </p>
                        <p className="text-xs text-gray-500 mb-1">scans</p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          {scanStats.total > 0 ? Math.round((scanStats.normal / scanStats.total) * 100) : 0}% of total
                        </p>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-lg border border-gray-100 shadow-sm relative group hover:border-red-300/30 transition-all duration-300">
                      <div className="absolute top-0 right-0 m-4 opacity-10 group-hover:opacity-30 transition-opacity duration-300">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                      </div>
                      <p className="text-sm text-gray-600 mb-1">Abnormal Results</p>
                      <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-red-500">
                          {scanStats.abnormal}
                        </p>
                        <p className="text-xs text-gray-500 mb-1">scans</p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500">
                          {scanStats.total > 0 ? Math.round((scanStats.abnormal / scanStats.total) * 100) : 0}% of total
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-gradient-to-br from-cancer-teal/5 to-transparent"></div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editedUserData.name}
                onChange={(e) => setEditedUserData({ ...editedUserData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                value={userData.email}
                disabled
                className="col-span-3 bg-gray-50"
              />
              <div className="col-span-4 text-xs text-gray-500 text-right">
                Email cannot be changed
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUpdating}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateProfile}
              disabled={isUpdating}
              className="bg-gradient-to-r from-cancer-blue to-cancer-purple hover:from-cancer-purple hover:to-cancer-blue transition-all duration-300"
            >
              {isUpdating ? (
                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
