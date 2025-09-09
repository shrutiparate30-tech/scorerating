import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { Star, Users, LogOut, Edit2 } from 'lucide-react';

interface StoreInfo {
  id: string;
  name: string;
  email: string;
  address: string;
  average_rating: number;
  total_ratings: number;
}

interface RatingWithUser {
  id: string;
  rating: number;
  created_at: string;
  user_name: string;
  user_email: string;
  user_address: string;
}

export const StoreOwnerDashboard = () => {
  const { signOut, updatePassword, user } = useAuth();
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [ratings, setRatings] = useState<RatingWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchStoreData();
  }, [user]);

  const fetchStoreData = async () => {
    if (!user) return;

    try {
      // Fetch store information
      const { data: storeData } = await supabase
        .from('store_ratings')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (storeData) {
        setStoreInfo(storeData);

        // Fetch ratings with user information
        const { data: ratingsData } = await supabase
          .from('ratings')
          .select(`
            id,
            rating,
            created_at,
            user_id
          `)
          .eq('store_id', storeData.id)
          .order('created_at', { ascending: false });

        // Fetch user profiles separately
        const userIds = ratingsData?.map(r => r.user_id) || [];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, name, email, address')
          .in('id', userIds);

        const profilesMap = new Map(
          profilesData?.map(p => [p.id, p]) || []
        );

        const formattedRatings = ratingsData?.map(rating => {
          const profile = profilesMap.get(rating.user_id);
          return {
            id: rating.id,
            rating: rating.rating,
            created_at: rating.created_at,
            user_name: profile?.name || 'Unknown',
            user_email: profile?.email || 'Unknown',
            user_address: profile?.address || 'Unknown'
          };
        }) || [];

        setRatings(formattedRatings);
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch store data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword.trim()) {
      toast({
        title: "Error",
        description: "Please enter a new password",
        variant: "destructive"
      });
      return;
    }

    await updatePassword(newPassword);
    setNewPassword('');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => {
      const isFilled = index < rating;
      return (
        <Star
          key={index}
          className={`h-4 w-4 ${
            isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      );
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  if (!storeInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>No Store Found</CardTitle>
            <CardDescription>
              You don't have a store associated with your account. Please contact the administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={signOut} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Store Owner Dashboard</h1>
            <p className="text-muted-foreground">{storeInfo.name}</p>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit2 className="mr-2 h-4 w-4" />
                  Update Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Password</DialogTitle>
                  <DialogDescription>Enter your new password</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <Button onClick={handlePasswordUpdate} className="w-full">
                    Update Password
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button onClick={signOut} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Store Info Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{storeInfo.average_rating.toFixed(1)}</div>
                <div className="flex">
                  {renderStars(Math.round(storeInfo.average_rating))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Out of 5 stars
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storeInfo.total_ratings}</div>
              <p className="text-xs text-muted-foreground">
                Reviews submitted
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Store Details */}
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">Store Name</Label>
                <p className="text-sm text-muted-foreground">{storeInfo.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">{storeInfo.email}</p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium">Address</Label>
                <p className="text-sm text-muted-foreground">{storeInfo.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ratings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Reviews</CardTitle>
            <CardDescription>
              Users who have submitted ratings for your store
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ratings.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ratings.map((rating) => (
                    <TableRow key={rating.id}>
                      <TableCell>{rating.user_name}</TableCell>
                      <TableCell>{rating.user_email}</TableCell>
                      <TableCell>{rating.user_address}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {renderStars(rating.rating)}
                          <span className="ml-1 text-sm">({rating.rating}/5)</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(rating.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  No reviews yet. Encourage customers to rate your store!
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};