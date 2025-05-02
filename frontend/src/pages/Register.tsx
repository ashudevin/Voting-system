import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Container,
  Grid,
  Alert,
  CircularProgress,
  Snackbar,
  Card,
  CardMedia,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import Webcam from 'react-webcam';
import { registerVoter } from '../services/api';

const Register: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharError, setAadharError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  // Calculate responsive webcam dimensions
  const webcamWidth = isMobile ? 300 : isTablet ? 400 : 500;
  const webcamHeight = (webcamWidth * 3) / 4; // 4:3 aspect ratio
  
  const videoConstraints = {
    width: webcamWidth,
    height: webcamHeight,
    facingMode: 'user',
  };

  const handleAadharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits
    if (value === '' || /^\d+$/.test(value)) {
      setAadharNumber(value);
      
      // Clear error when field is empty
      if (value === '') {
        setAadharError(null);
      } 
      // Show error if length is wrong but only if user has typed something
      else if (value.length !== 12) {
        setAadharError('Aadhar number must be exactly 12 digits');
      } else {
        setAadharError(null);
      }
    }
  };

  const handleCapture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
    }
  }, [webcamRef]);

  const handleRegister = async () => {
    if (!aadharNumber) {
      setError('Please enter your Aadhar number');
      return;
    }

    if (aadharNumber.length !== 12) {
      setError('Aadhar number must be exactly 12 digits');
      return;
    }

    if (!capturedImage) {
      setError('Please capture your image first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert base64 to file
      const blob = await fetch(capturedImage).then(res => res.blob());
      const imageFile = new File([blob], 'face.jpg', { type: 'image/jpeg' });

      const response = await registerVoter(aadharNumber, imageFile);
      
      setSuccess(`Registration successful for ${aadharNumber}`);
      // Reset form
      setAadharNumber('');
      setCapturedImage(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, mt: 4 }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          Voter Registration
        </Typography>
        <Typography variant="body1" paragraph align="center" color="text.secondary">
          Register to vote by providing your Aadhar number and face scan
        </Typography>

        <Box component="form" noValidate sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <TextField
                required
                fullWidth
                id="aadhar"
                label="Aadhar Number"
                name="aadhar"
                autoComplete="off"
                value={aadharNumber}
                onChange={handleAadharChange}
                inputProps={{ 
                  maxLength: 12,
                  inputMode: 'numeric',
                  pattern: '[0-9]*'
                }}
                error={!!aadharError}
                helperText={aadharError || "Enter your 12-digit Aadhar number"}
              />
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>
                Face Capture
              </Typography>
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
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={retakePhoto}
                    fullWidth
                    sx={{ 
                      maxWidth: { xs: 300, sm: 400, md: 500 },
                      py: { xs: 1, sm: 1.5 },
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    Retake Photo
                  </Button>
                </Box>
              )}
            </Box>

            <Box>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                onClick={handleRegister}
                disabled={loading || !aadharNumber || aadharNumber.length !== 12 || !capturedImage}
                sx={{ 
                  mt: 2, 
                  py: { xs: 1.2, sm: 1.5 },
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                {loading ? <CircularProgress size={24} /> : 'Register'}
              </Button>
            </Box>
          </Box>
        </Box>

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

export default Register; 