'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Tabs,
  Tab,
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
  const [activeTab, setActiveTab] = useState(0);

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

  const activePlan = plans[activeTab];

  return (
    <Box>
      <PageContainer>
        {plans.length > 0 ? (
          <>
            <Tabs 
              value={activeTab} 
              onChange={(_, newValue) => setActiveTab(newValue)} 
              sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              {plans.map((plan, index) => (
                <Tab key={plan._id} label={plan.name || `Plan ${index + 1}`} />
              ))}
            </Tabs>
            {activePlan && (
              <Paper sx={{ height: 'calc(100vh - 300px)', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PictureAsPdf color="primary" /> {activePlan.name || 'Personalized Diet Plan'}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<Download />} 
                    href={activePlan.fileUrl} 
                    target="_blank"
                  >
                    Download PDF
                  </Button>
                </Box>
                {activePlan.description && (
                  <Box sx={{ px: 2, pb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {activePlan.description}
                    </Typography>
                  </Box>
                )}
                <Divider />
                <Box sx={{ flexGrow: 1, p: 2 }}>
                  <iframe 
                    src={`${activePlan.fileUrl}#toolbar=0`} 
                    width="100%" 
                    height="100%" 
                    style={{ border: 'none', borderRadius: 8 }}
                    title="Diet Plan PDF"
                  />
                </Box>
              </Paper>
            )}
          </>
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
