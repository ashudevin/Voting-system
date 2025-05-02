import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Container,
  Grid,
  Alert,
  CircularProgress,
  Snackbar,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Stack,
  Divider,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import Webcam from 'react-webcam';
import { verifyVoter, castVote } from '../services/api';

// Party options
const PARTIES = [
  { id: 'BJP', name: 'BJP', color: '#FF9933' },
  { id: 'CONGRESS', name: 'Congress', color: '#0078D7' },
  { id: 'AAP', name: 'AAP', color: '#1FAA59' },
  { id: 'NOTA', name: 'NOTA', color: '#666666' },
];

const Vote: React.FC = () => {
  const [step, setStep] = useState<'verify' | 'vote'>('verify');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [voter, setVoter] = useState<{ aadhar_number: string; has_voted: boolean } | null>(null);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const handleCapture = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const handleVerify = async () => {
    if (!capturedImage) {
      setError('Please capture your image first');
      return;
    }

    setLoading(true);
    setError(null);
    setSecurityError(null);

    try {
      // Convert base64 to file
      const blob = await fetch(capturedImage).then(res => res.blob());
      const imageFile = new File([blob], 'face.jpg', { type: 'image/jpeg' });

      const voterData = await verifyVoter(imageFile);
      
      if (voterData.has_voted) {
        setError('You have already cast your vote');
        setCapturedImage(null);
        setLoading(false);
        return;
      }
      
      setVoter(voterData);
      setStep('vote');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Verification failed. Please try again.';
      
      // Handle security errors specifically
      if (errorMessage.includes("This face has already voted with Aadhar")) {
        setSecurityError(errorMessage);
      } else {
        setError(errorMessage);
      }
      
      setCapturedImage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (partyId: string) => {
    if (!voter) return;
    
    setSelectedParty(partyId);
    setLoading(true);
    setError(null);

    try {
      await castVote({
        aadhar_number: voter.aadhar_number,
        party: partyId
      });
      
      setSuccess(`Your vote for ${partyId} has been recorded successfully`);
      
      // Reset state after successful vote
      setTimeout(() => {
        setStep('verify');
        setVoter(null);
        setCapturedImage(null);
        setSelectedParty(null);
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to cast vote. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          {step === 'verify' ? 'Voter Verification' : 'Cast Your Vote'}
        </Typography>

        {step === 'verify' ? (
          <>
            <Typography variant="body1" paragraph align="center" color="text.secondary">
              Please look at the camera and take a photo to verify your identity
            </Typography>

            {securityError && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  fontWeight: 'bold',
                  backgroundColor: 'rgba(211, 47, 47, 0.1)',
                  border: '1px solid #d32f2f',
                  '& .MuiAlert-icon': {
                    color: '#d32f2f',
                    fontSize: '1.5rem'
                  }
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Security Alert:
                </Typography>
                {securityError}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ mt: 3 }}>
              {!capturedImage ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Card sx={{ width: '100%', maxWidth: 500, mb: 2 }}>
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{
                        width: 500,
                        height: 375,
                        facingMode: 'user',
                      }}
                      style={{ width: '100%', height: 'auto' }}
                    />
                  </Card>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CameraAltIcon />}
                    onClick={handleCapture}
                    fullWidth
                    sx={{ maxWidth: 500 }}
                  >
                    Capture Photo
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Card sx={{ width: '100%', maxWidth: 500, mb: 2 }}>
                    <CardMedia
                      component="img"
                      image={capturedImage}
                      alt="Captured face"
                      sx={{ width: '100%', height: 'auto' }}
                    />
                  </Card>
                  <Stack direction="row" spacing={2} sx={{ maxWidth: 500, width: '100%' }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={retakePhoto}
                      fullWidth
                    >
                      Retake Photo
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleVerify}
                      fullWidth
                      disabled={loading}
                      startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                      Verify Identity
                    </Button>
                  </Stack>
                </Box>
              )}
            </Box>
          </>
        ) : (
          <>
            <Typography variant="body1" paragraph align="center" color="text.secondary">
              {`Welcome, voter with Aadhar ${voter?.aadhar_number}. Please select a party to cast your vote.`}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {PARTIES.map((party) => (
                  <Box sx={{ width: { xs: '100%', sm: '47%', md: '47%' }, mb: 2 }} key={party.id}>
                    <Card 
                      elevation={selectedParty === party.id ? 6 : 1}
                      sx={{ 
                        border: selectedParty === party.id ? `2px solid ${party.color}` : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <CardActionArea 
                        onClick={() => !loading && handleVote(party.id)}
                        disabled={loading}
                        sx={{ p: 2 }}
                      >
                        <CardContent>
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              flexDirection: 'column',
                              minHeight: 120,
                            }}
                          >
                            <Box 
                              sx={{ 
                                width: 80, 
                                height: 80, 
                                borderRadius: '50%', 
                                bgcolor: party.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2,
                              }}
                            >
                              <HowToVoteIcon sx={{ color: 'white', fontSize: 40 }} />
                            </Box>
                            <Typography variant="h5" component="div" align="center">
                              {party.name}
                            </Typography>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Box>
                ))}
              </Box>

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <CircularProgress size={40} />
                </Box>
              )}
            </Box>
          </>
        )}

        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default Vote; 