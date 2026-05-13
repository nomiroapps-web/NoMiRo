import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { Header } from "@/components/Header";
import { ChildAvatar, AvatarSelector } from "@/components/ChildAvatar";
import { SecuritySettings } from "@/components/SecuritySettings";
import { ParentManagement } from "@/components/ParentManagement";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/db";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  Save, 
  Pencil, 
  Trash2, 
  Users, 
  Settings2,
  DollarSign,
  Shield,
  Sparkles,
  Globe,
  MapPin,
  Bell
} from "lucide-react";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import {
  detectUserLocale,
  formatCurrency,
  getCurrencyOptions,
  getLocaleOptions,
  getCurrencySymbol,
} from "@/lib/locale";

interface Child {
  id: string;
  name: string;
  age: number | null;
  avatar_index: number;
  points_balance: number;
  level: number;
  pin_code?: string | null;
  email: string | null;
  birthdate: string | null;
}

interface Family {
  id: string;
  name: string;
  point_to_currency_rate: number;
  currency_code: string;
  currency_symbol: string;
  locale: string;
}

export default function FamilySettings() {
  const navigate = useNavigate();
  useAutoLogout();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Edit states
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [deletingChild, setDeletingChild] = useState<Child | null>(null);
  
  // Form states
  const [familyName, setFamilyName] = useState("");
  const [pointRate, setPointRate] = useState(0.05);
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [locale, setLocale] = useState("en-US");
  
  // Edit child form
  const [editChildName, setEditChildName] = useState("");
  const [editChildAge, setEditChildAge] = useState("");
  const [editChildAvatar, setEditChildAvatar] = useState(1);
  const [editChildPin, setEditChildPin] = useState("");
  const [editChildEmail, setEditChildEmail] = useState("");
  const [editChildBirthdate, setEditChildBirthdate] = useState("");
  const [showPin, setShowPin] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setUser(session.user);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadData = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .single();
      
      setProfile(profileData);

      const { data: familyData } = await supabase
        .from("families")
        .select("id, name, point_to_currency_rate, currency_code, currency_symbol, locale")
        .eq("owner_id", userId)
        .single();

      if (familyData) {
        // Auto-detect locale if not set
        if (!familyData.currency_code || familyData.currency_code === "USD") {
          const detected = detectUserLocale();
          if (detected.currency !== "USD") {
            // Auto-update with detected locale
            await supabase
              .from("families")
              .update({
                currency_code: detected.currency,
                currency_symbol: detected.symbol,
                locale: detected.locale,
              })
              .eq("id", familyData.id);
            
            familyData.currency_code = detected.currency;
            familyData.currency_symbol = detected.symbol;
            familyData.locale = detected.locale;
          }
        }

        setFamily(familyData as Family);
        setFamilyName(familyData.name);
        setPointRate(familyData.point_to_currency_rate || 0.05);
        setCurrencyCode(familyData.currency_code || "USD");
        setLocale(familyData.locale || "en-US");

        const { data: childrenData } = await supabase
          .from("children")
          .select("id, name, age, avatar_index, points_balance, level, email, birthdate")
          .eq("family_id", familyData.id)
          .order("created_at", { ascending: true });

        setChildren(childrenData || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleSaveFamilySettings = async () => {
    if (!family) return;

    setIsSaving(true);
    try {
      const symbol = getCurrencySymbol(currencyCode);
      const { error } = await supabase
        .from("families")
        .update({
          name: familyName.trim(),
          point_to_currency_rate: pointRate,
          currency_code: currencyCode,
          currency_symbol: symbol,
          locale: locale,
        })
        .eq("id", family.id);

      if (error) throw error;

      setFamily({ 
        ...family, 
        name: familyName.trim(), 
        point_to_currency_rate: pointRate,
        currency_code: currencyCode,
        currency_symbol: symbol,
        locale: locale,
      });
      toast.success("Family settings saved!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    setEditChildName(child.name);
    setEditChildAge(child.age?.toString() || "");
    setEditChildAvatar(child.avatar_index || 1);
    setEditChildPin("");
    setEditChildEmail(child.email || "");
    setEditChildBirthdate(child.birthdate || "");
    setShowPin(false);
  };

  const handleSaveChild = async () => {
    if (!editingChild || !editChildName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    try {
      const updateData: any = {
        name: editChildName.trim(),
        age: editChildAge ? parseInt(editChildAge) : null,
        avatar_index: editChildAvatar,
        email: editChildEmail.trim() || null,
        birthdate: editChildBirthdate || null,
      };

      // Only include pin_code in the update if it was changed (non-empty)
      // Use the set_child_pin RPC to hash the PIN
      if (editChildPin) {
        await supabase.rpc("set_child_pin", {
          _child_id: editingChild.id,
          _pin: editChildPin,
        });
      }

      const { error } = await supabase
        .from("children")
        .update(updateData)
        .eq("id", editingChild.id);

      if (error) throw error;

      setChildren(children.map(c => 
        c.id === editingChild.id 
          ? { ...c, name: editChildName.trim(), age: editChildAge ? parseInt(editChildAge) : null, avatar_index: editChildAvatar, email: editChildEmail.trim() || null, birthdate: editChildBirthdate || null }
          : c
      ));
      setEditingChild(null);
      toast.success("Child profile updated!");
    } catch (error) {
      console.error("Error updating child:", error);
      toast.error("Failed to update profile");
    }
  };

  const handleDeleteChild = async () => {
    if (!deletingChild) return;

    try {
      const { error } = await supabase
        .from("children")
        .delete()
        .eq("id", deletingChild.id);

      if (error) throw error;

      setChildren(children.filter(c => c.id !== deletingChild.id));
      setDeletingChild(null);
      toast.success("Child removed from family");
    } catch (error) {
      console.error("Error deleting child:", error);
      toast.error("Failed to remove child");
    }
  };

  const handleResetPoints = async (childId: string) => {
    try {
      const { error } = await supabase
        .from("children")
        .update({ points_balance: 0 })
        .eq("id", childId);

      if (error) throw error;

      setChildren(children.map(c => 
        c.id === childId ? { ...c, points_balance: 0 } : c
      ));
      toast.success("Points have been reset");
    } catch (error) {
      console.error("Error resetting points:", error);
      toast.error("Failed to reset points");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          className="text-4xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          ⚙️
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        variant="parent" 
        userName={profile?.full_name} 
        onLogout={handleLogout}
      />

      <main className="container max-w-4xl px-4 py-8">
        {/* Back Button & Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/parent")}
            className="mb-4"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Button>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Family Settings ⚙️
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage your family profile and preferences
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Family Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Settings2 size={20} />
                  </div>
                  <div>
                    <CardTitle>Family Profile</CardTitle>
                    <CardDescription>Basic family information</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="familyName">Family Name</Label>
                  <Input
                    id="familyName"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    placeholder="Enter family name"
                  />
                </div>
                <Button onClick={handleSaveFamilySettings} disabled={isSaving}>
                  <Save size={18} />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Locale & Currency Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent-foreground">
                    <Globe size={20} />
                  </div>
                  <div>
                    <CardTitle>Region & Currency</CardTitle>
                    <CardDescription>Set your language and currency preferences</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="locale">Language</Label>
                    <Select value={locale} onValueChange={setLocale}>
                      <SelectTrigger id="locale">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {getLocaleOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={currencyCode} onValueChange={setCurrencyCode}>
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {getCurrencyOptions().map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
                  <MapPin size={16} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Settings auto-detected from your location. Change anytime.
                  </p>
                </div>
                <Button onClick={handleSaveFamilySettings} disabled={isSaving}>
                  <Save size={18} />
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Points Settings Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-points/10 text-points">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <CardTitle>Point Conversion</CardTitle>
                    <CardDescription>Set how points convert to real money</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Points to Currency Rate</Label>
                    <span className="font-mono text-lg font-semibold text-primary">
                      1 point = {formatCurrency(pointRate, currencyCode, locale)}
                    </span>
                  </div>
                  <Slider
                    value={[pointRate * 100]}
                    onValueChange={(value) => setPointRate(value[0] / 100)}
                    max={25}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(0.01, currencyCode, locale)}</span>
                    <span>{formatCurrency(0.25, currencyCode, locale)}</span>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    <Sparkles className="mr-1 inline h-4 w-4 text-points" />
                    Example: 100 points = <strong className="text-foreground">{formatCurrency(100 * pointRate, currencyCode, locale)}</strong>
                  </p>
                </div>
                <Button onClick={handleSaveFamilySettings} disabled={isSaving}>
                  <Save size={18} />
                  {isSaving ? "Saving..." : "Save Rate"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Children Profiles Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    <Users size={20} />
                  </div>
                  <div>
                    <CardTitle>Children Profiles</CardTitle>
                    <CardDescription>Manage your children's accounts</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {children.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-8 text-center">
                    <p className="text-muted-foreground">No children added yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => navigate("/parent")}
                    >
                      Add your first child
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <ChildAvatar avatarIndex={child.avatar_index || 1} size="md" />
                          <div>
                            <h3 className="font-semibold">{child.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {child.age ? `${child.age} years old` : "Age not set"} • Level {child.level || 1}
                            </p>
                            <p className="text-sm font-medium text-points">
                              {child.points_balance || 0} points
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditChild(child)}
                          >
                            <Pencil size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingChild(child)}
                          >
                            <Trash2 size={18} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Parent Management */}
          {family && user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <ParentManagement 
                familyId={family.id}
                familyName={family.name}
                ownerId={user.id} 
                currentUserId={user.id}
                inviterName={profile?.full_name || "A family member"}
              />
            </motion.div>
          )}

          {/* Security Settings */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <SecuritySettings userId={user.id} />
            </motion.div>
          )}

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Bell size={20} />
                  </div>
                  <div>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Manage how you receive updates</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <PushNotificationToggle />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Edit Child Dialog */}
      <Dialog open={!!editingChild} onOpenChange={() => setEditingChild(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Child Profile</DialogTitle>
            <DialogDescription>
              Update {editingChild?.name}'s profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Avatar</Label>
              <AvatarSelector
                selectedIndex={editChildAvatar}
                onSelect={setEditChildAvatar}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editChildName}
                onChange={(e) => setEditChildName(e.target.value)}
                placeholder="Child's name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editAge">Age</Label>
              <Input
                id="editAge"
                type="number"
                min="1"
                max="18"
                value={editChildAge}
                onChange={(e) => setEditChildAge(e.target.value)}
                placeholder="Age (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email (optional)</Label>
              <Input
                id="editEmail"
                type="email"
                value={editChildEmail}
                onChange={(e) => setEditChildEmail(e.target.value)}
                placeholder="child@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Add an email to send notifications
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editBirthdate">Birthdate</Label>
              <Input
                id="editBirthdate"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={editChildBirthdate}
                onChange={(e) => setEditChildBirthdate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                🎂 We'll celebrate their birthday!
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="editPin">PIN Code (for child login)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPin(!showPin)}
                >
                  {showPin ? "Hide" : "Show"}
                </Button>
              </div>
              <Input
                id="editPin"
                type={showPin ? "text" : "password"}
                value={editChildPin}
                onChange={(e) => setEditChildPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="4-digit PIN"
                maxLength={4}
              />
              <p className="text-xs text-muted-foreground">
                <Shield className="mr-1 inline h-3 w-3" />
                Optional: Set a PIN for secure child login
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="text-warning"
              onClick={() => editingChild && handleResetPoints(editingChild.id)}
            >
              Reset Points
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingChild(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveChild}>
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingChild} onOpenChange={() => setDeletingChild(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deletingChild?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deletingChild?.name} from your family.
              All their tasks, points, and achievements will be deleted.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChild}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
