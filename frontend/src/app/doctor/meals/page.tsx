'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Avatar, Box, Button, Card, Chip, Dialog, DialogContent, DialogTitle, IconButton, MenuItem, Skeleton, TextField, Typography } from '@mui/material';
import { ArrowForward, CheckCircleOutlined, Close, PhotoLibraryOutlined, RestaurantOutlined } from '@mui/icons-material';
import PageContainer from '@/components/layout/PageContainer';
import { api, User, MealLog } from '@/lib/api';

export default function DoctorMealsPage() {
  const [clients, setClients] = useState<User[]>([]);
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loadError, setLoadError] = useState('');
  const [preview, setPreview] = useState<{ meal: MealLog; client: User } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listClients('client'), api.getClientsDailyStatus(date)])
      .then(([clientResult, statusResult]) => {
        if (cancelled) return;
        setClients(clientResult.clients); setMeals(statusResult.meals);
      })
      .catch(() => { if (!cancelled) setLoadError('Could not load meal photos. Please reload to try again.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [date]);

  const mealsByClient = new Map<string, MealLog[]>();
  for (const meal of meals) {
    const group = mealsByClient.get(meal.userId) ?? [];
    group.push(meal); mealsByClient.set(meal.userId, group);
  }
  for (const group of mealsByClient.values()) group.sort((a, b) => Date.parse(b.takenAt) - Date.parse(a.takenAt));
  const submittedCount = clients.filter(client => mealsByClient.has(client._id)).length;
  const filteredClients = clients.filter(client => {
    const query = search.trim().toLowerCase();
    return `${client.name} ${client.email} ${client.whatsappNumber || ''}`.toLowerCase().includes(query)
      && (statusFilter === 'all' || mealsByClient.has(client._id) === (statusFilter === 'submitted'));
  }).sort((a, b) => Number(mealsByClient.has(b._id)) - Number(mealsByClient.has(a._id)) || a.name.localeCompare(b.name));

  return <PageContainer>
    <Box sx={{ mb: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 750, mb: 0.75 }}>Meal photos</Typography>
      <Typography color="text.secondary">See what your clients are eating and review their daily uploads.</Typography>
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 3 }}>
      {[
        { label: 'Photos uploaded', value: meals.length, icon: <PhotoLibraryOutlined />, color: 'primary.main' },
        { label: 'Clients submitted', value: submittedCount, icon: <CheckCircleOutlined />, color: 'success.main' },
        { label: 'Awaiting uploads', value: clients.length - submittedCount, icon: <RestaurantOutlined />, color: 'warning.main' },
      ].map(stat => <Card key={stat.label} variant="outlined" sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, boxShadow: 'none' }}>
        <Box sx={{ color: stat.color, display: 'flex' }}>{stat.icon}</Box>
        <Box><Typography variant="h5" sx={{ fontWeight: 750 }}>{loading ? '—' : stat.value}</Typography><Typography variant="body2" color="text.secondary">{stat.label}</Typography></Box>
      </Card>)}
    </Box>
    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
      <TextField size="small" label="Search clients" placeholder="Name, email or WhatsApp" value={search} onChange={event => setSearch(event.target.value)} sx={{ flex: 1, minWidth: 200 }} />
      <TextField size="small" type="date" label="Upload date" value={date} onChange={event => {
        if (!event.target.value) return;
        setDate(event.target.value); setLoading(true); setMeals([]); setLoadError('');
      }} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField size="small" select label="Meal status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)} sx={{ minWidth: 165 }}>
        <MenuItem value="all">All clients</MenuItem><MenuItem value="submitted">Submitted</MenuItem><MenuItem value="pending">Awaiting uploads</MenuItem>
      </TextField>
    </Box>
    {loadError && <Alert severity="error" sx={{ mb: 2 }}>{loadError}</Alert>}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, alignItems: 'start', gap: 2.5 }}>
      {loading ? Array.from({ length: 4 }, (_, index) => <Skeleton key={index} variant="rounded" height={300} />) : filteredClients.map(client => {
        const uploads = mealsByClient.get(client._id) ?? [];
        return <Card key={client._id} variant="outlined" sx={{ boxShadow: 'none', overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'action.selected', color: 'primary.main', fontWeight: 700 }}>{client.name.charAt(0).toUpperCase()}</Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}><Typography sx={{ fontWeight: 700 }} noWrap>{client.name}</Typography><Typography variant="caption" color="text.secondary" noWrap component="p">{client.email}</Typography></Box>
            <Chip label={uploads.length ? `${uploads.length} photo${uploads.length === 1 ? '' : 's'}` : 'Awaiting upload'} color={uploads.length ? 'success' : 'default'} size="small" variant="outlined" />
          </Box>
          {uploads.length ? <Box sx={{ px: 2.5, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1.5 }}>
            {uploads.map(meal => <Box key={meal._id}>
              <Box component="button" type="button" onClick={() => setPreview({ meal, client })} aria-label={`View ${client.name}’s meal photo`} sx={{ p: 0, width: '100%', display: 'block', border: 0, borderRadius: '10px', overflow: 'hidden', cursor: 'zoom-in', bgcolor: 'action.hover', '&:focus-visible': { outline: '3px solid', outlineColor: 'primary.main', outlineOffset: 2 } }}>
                <Box component="img" src={meal.imageUrl} alt={`Meal uploaded by ${client.name}`} loading="lazy" sx={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', display: 'block', transition: 'transform 180ms', '&:hover': { transform: 'scale(1.03)' } }} />
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>{new Date(meal.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
              {meal.notes && <Typography variant="body2" sx={{ mt: 0.25, overflowWrap: 'anywhere' }}>{meal.notes}</Typography>}
            </Box>)}
          </Box> : <Box sx={{ mx: 2.5, p: 3, textAlign: 'center', borderRadius: '10px', bgcolor: 'action.hover' }}>
            <RestaurantOutlined sx={{ color: 'text.disabled', mb: 0.5 }} /><Typography variant="body2" color="text.secondary">No meal photos for this date</Typography>
          </Box>}
          <Box sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'flex-end' }}><Button component={Link} href={`/doctor/clients/${client._id}`} size="small" endIcon={<ArrowForward />} sx={{ textTransform: 'none' }}>View client</Button></Box>
        </Card>;
      })}
    </Box>
    {!loading && !loadError && !filteredClients.length && <Box sx={{ py: 8, textAlign: 'center' }}><PhotoLibraryOutlined sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} /><Typography variant="h6">No matching clients</Typography><Typography color="text.secondary">Try another name or change the meal status filter.</Typography></Box>}
    <Dialog open={!!preview} onClose={() => setPreview(null)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pr: 7 }}>{preview?.client.name}’s meal<IconButton aria-label="Close photo preview" onClick={() => setPreview(null)} sx={{ position: 'absolute', right: 12, top: 12 }}><Close /></IconButton></DialogTitle>
      <DialogContent>{preview && <>
        <Box component="img" src={preview.meal.imageUrl} alt={`Meal uploaded by ${preview.client.name}`} sx={{ display: 'block', width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>{new Date(preview.meal.takenAt).toLocaleString()}</Typography>
        {preview.meal.notes && <Typography sx={{ mt: 1, overflowWrap: 'anywhere' }}>{preview.meal.notes}</Typography>}
      </>}</DialogContent>
    </Dialog>
  </PageContainer>;
}
