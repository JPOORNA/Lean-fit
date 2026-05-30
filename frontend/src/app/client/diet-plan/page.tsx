'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
} from '@mui/material';
import {
  PictureAsPdf,
  Download,
} from '@mui/icons-material';
import PageContainer from '@/components/layout/PageContainer';
import { api, DietPlan } from '@/lib/api';

export default function DietPlanPage() {
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await api.listMyDietPlans();
        setPlans(data.plans);
      } catch (err) {
        console.error('Failed to fetch plans', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const latestPlan = plans[0];

  return (
    <Box>
      <PageContainer>
        {latestPlan ? (
          <Paper sx={{ height: 'calc(100vh - 250px)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PictureAsPdf color="primary" /> {latestPlan.name || 'Personalized Diet Plan'}
              </Typography>
              <Button 
                variant="outlined" 
                startIcon={<Download />} 
                href={latestPlan.fileUrl} 
                target="_blank"
              >
                Download PDF
              </Button>
            </Box>
            <Divider />
            <Box sx={{ flexGrow: 1, p: 2 }}>
              <iframe 
                src={`${latestPlan.fileUrl}#toolbar=0`} 
                width="100%" 
                height="100%" 
                style={{ border: 'none', borderRadius: 8 }}
                title="Diet Plan PDF"
              />
            </Box>
          </Paper>
        ) : (
          <Paper sx={{ py: 10, textAlign: 'center' }}>
            <PictureAsPdf sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary">No diet plan has been assigned to you yet.</Typography>
          </Paper>
        )}
      </PageContainer>
    </Box>
  );
}
