import React, { useState, useRef, useCallback } from 'react';
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
  useTheme,
  useMediaQuery,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [step, setStep] = useState<'verify' | 'vote'>('verify');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [voter, setVoter] = useState<{ aadhar_number: string; has_voted: boolean } | null>(null);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  // Calculate responsive webcam dimensions
  const webcamWidth = isMobile ? 300 : isTablet ? 400 : 500;
  const webcamHeight = (webcamWidth * 3) / 4; // 4:3 aspect ratio
  
  const videoConstraints = {
    width: webcamWidth,
    height: webcamHeight,
    facingMode: 'user',
  };

  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

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
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, mt: 4 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
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
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
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
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  width: '100%' 
                }}>
                  <Card sx={{ 
                    width: '100%', 
                    maxWidth: { xs: 300, sm: 400, md: 500 }, 
                    mb: 2,
                    mx: 'auto'
                  }}>
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={videoConstraints}
                      style={{ 
                        width: '100%', 
                        height: 'auto', 
                        objectFit: 'cover',
                      }}
                    />
                  </Card>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CameraAltIcon />}
                    onClick={handleCapture}
                    fullWidth
                    sx={{ 
                      maxWidth: { xs: 300, sm: 400, md: 500 },
                      py: { xs: 1, sm: 1.5 },
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    Capture Photo
                  </Button>
                </Box>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  width: '100%' 
                }}>
                  <Card sx={{ 
                    width: '100%', 
                    maxWidth: { xs: 300, sm: 400, md: 500 }, 
                    mb: 2,
                    mx: 'auto'
                  }}>
                    <CardMedia
                      component="img"
                      image={capturedImage}
                      alt="Captured face"
                      sx={{ width: '100%', height: 'auto' }}
                    />
                  </Card>
                  <Stack 
                    direction={{ xs: 'column', sm: 'row' }} 
                    spacing={2} 
                    sx={{ 
                      maxWidth: { xs: 300, sm: 400, md: 500 }, 
                      width: '100%' 
                    }}
                  >
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={retakePhoto}
                      fullWidth
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
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
                      sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
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
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: { xs: 2, sm: 3 },
                justifyContent: 'center'
              }}>
                {PARTIES.map((party) => (
                  <Box 
                    sx={{ 
                      width: { 
                        xs: '100%', 
                        sm: 'calc(50% - 16px)', 
                        md: 'calc(50% - 24px)' 
                      }, 
                      mb: 2 
                    }} 
                    key={party.id}
                  >
                    <Card 
                      elevation={selectedParty === party.id ? 6 : 1}
                      sx={{ 
                        border: selectedParty === party.id ? `2px solid ${party.color}` : 'none',
                        transition: 'all 0.3s ease',
                        height: '100%',
                      }}
                    >
                      <CardActionArea 
                        onClick={() => !loading && handleVote(party.id)}
                        disabled={loading}
                        sx={{ p: { xs: 1.5, sm: 2 }, height: '100%' }}
                      >
                        <CardContent>
                          <Typography 
                            variant="h5" 
                            component="div" 
                            gutterBottom 
                            align="center"
                            sx={{ 
                              color: party.color,
                              fontWeight: 'bold',
                              fontSize: { xs: '1.25rem', sm: '1.5rem' }
                            }}
                          >
                            {party.name}
                          </Typography>
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              justifyContent: 'center',
                              mt: 1
                            }}
                          >
                            <HowToVoteIcon 
                              sx={{ 
                                fontSize: { xs: 40, sm: 60 }, 
                                color: party.color 
                              }} 
                            />
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Box>
                ))}
              </Box>
            </Box>
          </>
        )}
        
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