import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { Star, Search, LogOut, Edit2 } from 'lucide-react';

interface StoreWithRating {
  id: string;
  name: string;
  address: string;
  average_rating: number;
  total_ratings: number;
  user_rating?: number;
}

export const NormalUserDashboard = () => {
  const { signOut, updatePassword, user } = useAuth();
  const [stores, setStores] = useState<StoreWithRating[]>([]);
  const [filteredStores, setFilteredStores] = useState<StoreWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedStore, setSelectedStore] = useState<StoreWithRating | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    // Filter stores based on search term
    const filtered = stores.filter(store =>
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStores(filtered);
  }, [stores, searchTerm]);

  const fetchStores = async () => {
    try {
      if (!user) return;

      // Fetch stores with average ratings
      const { data: storesData } = await supabase
        .from('store_ratings')
        .select('*');

      // Fetch user's ratings for these stores
      const { data: userRatings } = await supabase
        .from('ratings')
        .select('store_id, rating')
        .eq('user_id', user.id);

      const userRatingMap = new Map(
        userRatings?.map(r => [r.store_id, r.rating]) || []
      );

      const storesWithUserRatings = storesData?.map(store => ({
        ...store,
        user_rating: userRatingMap.get(store.id)
      })) || [];

      setStores(storesWithUserRatings);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast({
        title: "Error",
        description: "Failed to fetch stores",
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

  const handleRatingSubmit = async () => {
    if (!selectedStore || !user || rating === 0) return;

    try {
      if (selectedStore.user_rating) {
        // Update existing rating
        const { error } = await supabase
          .from('ratings')
          .update({ rating })
          .eq('user_id', user.id)
          .eq('store_id', selectedStore.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Rating updated successfully"
        });
      } else {
        // Insert new rating
        const { error } = await supabase
          .from('ratings')
          .insert({
            user_id: user.id,
            store_id: selectedStore.id,
            rating
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Rating submitted successfully"
        });
      }

      fetchStores();
      setSelectedStore(null);
      setRating(0);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const openRatingDialog = (store: StoreWithRating) => {
    setSelectedStore(store);
    setRating(store.user_rating || 0);
  };

  const renderStars = (currentRating: number, isInteractive = false) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isFilled = starValue <= (isInteractive ? (hoveredRating || currentRating) : currentRating);
      
      return (
        <Star
          key={index}
          className={`h-5 w-5 cursor-pointer transition-colors ${
            isFilled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
          onClick={isInteractive ? () => setRating(starValue) : undefined}
          onMouseEnter={isInteractive ? () => setHoveredRating(starValue) : undefined}
          onMouseLeave={isInteractive ? () => setHoveredRating(0) : undefined}
        />
      );
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading stores...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Store Directory</h1>
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

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Stores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search by store name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardContent>
        </Card>

        {/* Stores Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredStores.map((store) => (
            <Card key={store.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{store.name}</CardTitle>
                  {store.user_rating && (
                    <Badge variant="secondary">Rated by you</Badge>
                  )}
                </div>
                <CardDescription>{store.address}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Overall Rating */}
                  <div>
                    <p className="text-sm font-medium mb-1">Overall Rating</p>
                    <div className="flex items-center gap-2">
                      {renderStars(store.average_rating)}
                      <span className="text-sm text-muted-foreground">
                        {store.average_rating.toFixed(1)} ({store.total_ratings} reviews)
                      </span>
                    </div>
                  </div>

                  {/* User's Rating */}
                  {store.user_rating && (
                    <div>
                      <p className="text-sm font-medium mb-1">Your Rating</p>
                      <div className="flex items-center gap-2">
                        {renderStars(store.user_rating)}
                        <span className="text-sm text-muted-foreground">
                          {store.user_rating}/5
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => openRatingDialog(store)}
                      className="flex-1"
                      variant={store.user_rating ? "outline" : "default"}
                    >
                      {store.user_rating ? "Update Rating" : "Rate Store"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStores.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? "No stores found matching your search." : "No stores available."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Rating Dialog */}
        <Dialog open={!!selectedStore} onOpenChange={() => setSelectedStore(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedStore?.user_rating ? "Update Rating" : "Rate Store"}
              </DialogTitle>
              <DialogDescription>
                Rate {selectedStore?.name} from 1 to 5 stars
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <p className="mb-4 text-lg font-medium">{selectedStore?.name}</p>
                <div className="flex justify-center gap-1 mb-4">
                  {renderStars(rating, true)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Click on stars to rate (currently {rating}/5)
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedStore(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRatingSubmit}
                  disabled={rating === 0}
                  className="flex-1"
                >
                  {selectedStore?.user_rating ? "Update Rating" : "Submit Rating"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};