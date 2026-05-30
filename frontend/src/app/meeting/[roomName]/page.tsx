'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Box, IconButton } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useAuth } from '@/components/auth/AuthProvider';

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const roomName = params.roomName as string;
  const { user } = useAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !roomName) {
    return <Box sx={{ p: 4 }}>Loading meeting room...</Box>;
  }

  return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', borderBottom: 1, borderColor: 'divider' }}>
        <IconButton onClick={() => router.back()} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <span className="font-semibold text-lg">Consultation Room</span>
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        <JitsiMeeting
          domain="jitsi.riot.im"
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: true,
            disableModeratorIndicator: true,
            startScreenSharing: true,
            enableEmailInStats: false,
            prejoinPageEnabled: false
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false
          }}
          userInfo={{
            displayName: `${user?.name}`,
            email: `${user?.email}`
          }}
          onApiReady={(externalApi) => {
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
          }}
        />
      </Box>
    </Box>
  );
}
