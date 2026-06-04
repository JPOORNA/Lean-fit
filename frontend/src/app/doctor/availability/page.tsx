'use client';

import React from 'react';
import PageContainer from '@/components/layout/PageContainer';
import AvailabilityMap from '@/components/doctor/AvailabilityMap';
import { useAuth } from '@/components/auth/AuthProvider';

export default function AvailabilityPage() {
  const { user } = useAuth();
  
  return (
    <PageContainer>
      <AvailabilityMap 
        doctorTz={user?.timezone || 'UTC'} 
        standalone={true}
      />
    </PageContainer>
  );
}
