import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Container,
  LinearProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Upload = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Other',
    tags: '',
    videoFile: null
  });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = [
    'Gaming',
    'Music',
    'Education',
    'Entertainment',
    'Sports',
    'News',
    'Tech',
    'Other'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        videoFile: file
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadProgress(0);
    setError('');
    setSuccess('');

    if (!isAuthenticated) {
      setError('Please log in to upload videos');
      setLoading(false);
      return;
    }

    if (!formData.videoFile) {
      setError('Please select a video file');
      setLoading(false);
      return;
    }

    try {
      const uploadData = new FormData();
      uploadData.append('video', formData.videoFile);
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('category', formData.category);
      uploadData.append('tags', formData.tags);
      uploadData.append('uploader', user?.username || 'Unknown');
      uploadData.append('uploaderId', user?._id || user?.id || '');

      const response = await axios.post('/api/videos', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        },
      });

      setUploadProgress(100);
      setSuccess('Video uploaded successfully!');
      setTimeout(() => {
        navigate(`/video/${response.data._id}`);
      }, 2000);
    } catch (error) {
      setUploadProgress(0);
      setError(error.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Please log in to upload videos
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
            size="large"
          >
            Sign In
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
          Upload Video
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {loading && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Uploading video... {uploadProgress}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Video Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            margin="normal"
            required
            helperText="Maximum 100 characters"
            inputProps={{ maxLength: 100 }}
          />

          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            margin="normal"
            multiline
            rows={4}
            helperText="Maximum 5000 characters"
            inputProps={{ maxLength: 5000 }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              label="Category"
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            margin="normal"
            helperText="Separate tags with commas (e.g., gaming, tutorial, review)"
            placeholder="gaming, tutorial, review"
          />

          <Box sx={{ mt: 2, mb: 2 }}>
            <input
              accept="video/*"
              style={{ display: 'none' }}
              id="video-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="video-upload">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                sx={{ py: 2 }}
              >
                {formData.videoFile ? formData.videoFile.name : 'Select Video File'}
              </Button>
            </label>
          </Box>

          {formData.videoFile && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Selected file: {formData.videoFile.name} ({(formData.videoFile.size / (1024 * 1024)).toFixed(2)} MB)
              </Typography>
            </Box>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading || !formData.videoFile}
            sx={{ mt: 3, py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Upload Video'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Upload;
