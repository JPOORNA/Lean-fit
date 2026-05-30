'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Add,
  CloudUpload,
  Restaurant,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';
import PageContainer from '@/components/layout/PageContainer';
import { api, MealLog } from '@/lib/api';
import { format, subDays, addDays } from 'date-fns';
import { formatInTimeZone, getDateKeyInTimeZone } from '@/lib/dateUtils';
import { useAuth } from '@/components/auth/AuthProvider';

export default function MealPicsPage() {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchMeals = async () => {
    setLoading(true);
    try {
      const data = await api.listMyMeals();
      const tz = user?.timezone || 'UTC';
      const dateStr = getDateKeyInTimeZone(viewDate, tz);
      setMeals(data.meals.filter(m => getDateKeyInTimeZone(m.takenAt, tz) === dateStr));
    } catch (err) {
      console.error('Failed to fetch meals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, [viewDate]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('notes', notes);
    formData.append('takenAt', new Date().toISOString());

    try {
      await api.uploadMeal(formData);
      setUploadOpen(false);
      setFile(null);
      setNotes('');
      fetchMeals();
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <PageContainer>
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => setViewDate(subDays(viewDate, 1))}>
              <NavigateBefore />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {formatInTimeZone(viewDate, user?.timezone, { weekday: 'long', month: 'long', day: 'numeric' })}
            </Typography>
            <IconButton 
              onClick={() => setViewDate(addDays(viewDate, 1))}
              disabled={getDateKeyInTimeZone(viewDate, user?.timezone || 'UTC') === getDateKeyInTimeZone(new Date(), user?.timezone || 'UTC')}
            >
              <NavigateNext />
            </IconButton>
          </Box>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => setUploadOpen(true)}
          >
            Upload Meal
          </Button>
        </Box>

        {meals.length === 0 ? (
          <Paper sx={{ py: 10, textAlign: 'center', bgcolor: 'background.default', border: '2px dashed', borderColor: 'divider' }}>
            <Restaurant sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">No meals logged for this day.</Typography>
            <Button variant="text" sx={{ mt: 1 }} onClick={() => setUploadOpen(true)}>Log your first meal</Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {meals.map((meal) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={meal._id}>
                <Card>
                  <CardMedia
                    component="img"
                    height="240"
                    image={meal.imageUrl}
                    alt="Meal"
                    sx={{ objectFit: 'cover' }}
                  />
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      {formatInTimeZone(meal.takenAt, user?.timezone, { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {meal.notes || 'No notes added.'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Upload Dialog */}
        <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Upload New Meal</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                sx={{ py: 4, borderStyle: 'dashed' }}
              >
                {file ? file.name : 'Choose Image'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </Button>
              <TextField
                label="Notes"
                placeholder="What did you eat?"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleUpload} 
              disabled={!file || uploading}
            >
              {uploading ? 'Uploading...' : 'Save Meal'}
            </Button>
          </DialogActions>
        </Dialog>
      </PageContainer>
    </Box>
  );
}
