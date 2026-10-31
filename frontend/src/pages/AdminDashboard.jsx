import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, MessageSquare, LogOut, CheckCircle, AlertCircle, BookOpen, FileText, Bell, Mail, Users, TrendingUp, Microscope, Image as ImageIcon, Briefcase, Megaphone, Send, Database, Trash2, Plus } from 'lucide-react';

const AdminDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  
  // Student Data state
  const [studentFile, setStudentFile] = useState(null);
  const [studentUploadStatus, setStudentUploadStatus] = useState('');
  const [studentFields, setStudentFields] = useState([]);
  
  // Broadcast state
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastStatus, setBroadcastStatus] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  
  // Faculty Management state
  const [newFacultyEmail, setNewFacultyEmail] = useState('');
  const [newFacultyPassword, setNewFacultyPassword] = useState('');
  const [newFacultyName, setNewFacultyName] = useState('');
  const [newFacultyDept, setNewFacultyDept] = useState('Computer Science Engineering');
  const [newFacultyStatus, setNewFacultyStatus] = useState('');
  const [isCreatingNewFaculty, setIsCreatingNewFaculty] = useState(false);
  
  // Syllabus state
  const [syllabusYear, setSyllabusYear] = useState('Academic Year 2025-26');
  const [syllabusProgram, setSyllabusProgram] = useState('');
  const [syllabusFile, setSyllabusFile] = useState(null);
  const [syllabusUploadStatus, setSyllabusUploadStatus] = useState('');

  // Policy state
  const [policyName, setPolicyName] = useState('Research and Development Policy');
  const [policyFile, setPolicyFile] = useState(null);
  const [policyUploadStatus, setPolicyUploadStatus] = useState('');

  // Academic Calendar state
  const [calendarYearHeader, setCalendarYearHeader] = useState('Academic Year 2025-26');
  const [calendarYear, setCalendarYear] = useState('2025-26');
  const [calendarProgram, setCalendarProgram] = useState('');
  const [calendarFile, setCalendarFile] = useState(null);
  const [calendarUploadStatus, setCalendarUploadStatus] = useState('');

  // Time Table state
  const [timeTableDept, setTimeTableDept] = useState('Chemical Engineering');
  const [timeTableFile, setTimeTableFile] = useState(null);
  const [timeTableUploadStatus, setTimeTableUploadStatus] = useState('');

  // Events state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventUploadStatus, setEventUploadStatus] = useState('');

  // Faculty state
  const [facultyName, setFacultyName] = useState('');
  const [facultyDept, setFacultyDept] = useState('Computer Science Engineering');
  const [facultyDesignation, setFacultyDesignation] = useState('');
  const [facultyQualification, setFacultyQualification] = useState('');
  const [facultyEmail, setFacultyEmail] = useState('');
  const [facultyUploadStatus, setFacultyUploadStatus] = useState('');

  // Placements state
  const [placementYear, setPlacementYear] = useState('Placement Highlights 2025');
  const [placementTotalOffers, setPlacementTotalOffers] = useState('');
  const [placementHighestPackage, setPlacementHighestPackage] = useState('');
  const [placementAveragePackage, setPlacementAveragePackage] = useState('');
  const [placementTotalRecruiters, setPlacementTotalRecruiters] = useState('');
  const [placementUploadStatus, setPlacementUploadStatus] = useState('');

  // Research state
  const [researchTitle, setResearchTitle] = useState('');
  const [researchAuthors, setResearchAuthors] = useState('');
  const [researchJournal, setResearchJournal] = useState('');
  const [researchYear, setResearchYear] = useState('');
  const [researchLink, setResearchLink] = useState('');
  const [researchDept, setResearchDept] = useState('General');
  const [researchUploadStatus, setResearchUploadStatus] = useState('');

  // Gallery state
  const [galleryFile, setGalleryFile] = useState(null);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryCategory, setGalleryCategory] = useState('Campus');
  const [galleryUploadStatus, setGalleryUploadStatus] = useState('');

  // Blog state
  const [blogTitle, setBlogTitle] = useState('');
  const [blogAuthor, setBlogAuthor] = useState('ANITS Admin');
  const [blogContent, setBlogContent] = useState('');
  const [blogFile, setBlogFile] = useState(null);
  const [blogUploadStatus, setBlogUploadStatus] = useState('');

  // Jobs state
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [jobSalary, setJobSalary] = useState('');
  const [jobDeadline, setJobDeadline] = useState('');
  const [jobLink, setJobLink] = useState('');
  const [jobUploadStatus, setJobUploadStatus] = useState('');

  const policiesList = [
    "Research and Development Policy", "Innovation and Entrepreneurship Policy", "Institutional Ethics Policy",
    "IPR Policy", "IT Policy", "Maintenance Policy", "Placement Policy", "Non-Teaching Staff Welfare Policy",
    "E- Governance Policy", "Recruitment Policy", "Promotion Policy", "Maternity Leave Policy",
    "E- Waste Management Policy", "Waste management Policy", "Energy Policy", "Environmental Policy",
    "Green Campus Policy", "Code of Conduct", "Divyangjan Policy", "Anti-Ragging Policy", "RTI Policy"
  ];

  const deptsList = [
    "Chemical Engineering", "Civil Engineering", "Computer Science Engineering",
    "Electrical and Electronics Engineering", "Electronics and Communications Engineering",
    "Information Technology", "Mechanical Engineering"
  ];

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
      return;
    }
    fetchLogs(token);
    fetchEnquiries(token);
    fetchAnalytics(token);
    fetchStudentFields(token);
  }, [navigate]);

  const fetchLogs = async (token) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      } else {
        if (response.status === 401) {
          localStorage.removeItem('adminToken');
          navigate('/admin/login');
        }
      }
    } catch (err) {
      console.error('Failed to fetch logs', err);
    }
  };

  const fetchAnalytics = async (token) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    }
  };

  const handleExportCSV = async () => {
    const token = localStorage.getItem('adminToken');
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
    try {
      const response = await fetch(`${API_URL}/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chat_logs.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert('Failed to export CSV. Make sure you are logged in.');
      }
    } catch (err) {
      console.error('Failed to download CSV', err);
    }
  };

  const handleExportPDF = async () => {
    const token = localStorage.getItem('adminToken');
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
    try {
      const response = await fetch(`${API_URL}/api/admin/report.pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ANITS_Monthly_Report.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Failed to generate PDF. Make sure you are logged in.");
      }
    } catch (err) {
      console.error('Failed to download PDF', err);
    }
  };

  const fetchEnquiries = async (token) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}`;
      const response = await fetch(`${API_URL}/api/enquiries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEnquiries(data);
      }
    } catch (err) {
      console.error('Failed to fetch enquiries', err);
    }
  };

  const fetchStudentFields = async (token) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const response = await fetch(`${API_URL}/api/admin/student_fields`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStudentFields(data.fields || []);
      }
    } catch (err) {
      console.error('Failed to fetch student fields', err);
    }
  };

  const handleStudentUpload = async (e) => {
    e.preventDefault();
    if (!studentFile) {
      setStudentUploadStatus('Please select a file first.');
      return;
    }
    
    setStudentUploadStatus('Uploading and parsing data...');
    const formData = new FormData();
    formData.append('file', studentFile);
    
    const token = localStorage.getItem('adminToken');
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
    try {
      const response = await fetch(`${API_URL}/api/admin/upload_student_data`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      if (response.ok) {
        setStudentUploadStatus('✅ ' + data.message);
        setStudentFile(null);
        if (document.getElementById('studentFileInput')) {
            document.getElementById('studentFileInput').value = '';
        }
        fetchStudentFields(token);
      } else {
        setStudentUploadStatus('❌ ' + (data.error || 'Upload failed'));
      }
    } catch (err) {
      setStudentUploadStatus('❌ Upload error');
    }
  };

  const handleDeleteField = async (field) => {
    if (!window.confirm(`Are you sure you want to delete '${field}' from ALL student records?`)) return;
    
    const token = localStorage.getItem('adminToken');
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
    try {
      const response = await fetch(`${API_URL}/api/admin/delete_field`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ field })
      });
      if (response.ok) {
        fetchStudentFields(token);
      } else {
        const data = await response.json();
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error connecting to server.');
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setUploadStatus('Please select a PDF file first.');
      return;
    }
    
    setUploadStatus('Uploading...');
    const formData = new FormData();
    formData.append('file', file);
    
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/upload_circular`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      
      if (response.ok) {
        setUploadStatus('Upload successful! The Chatbot is now aware of this document.');
        setFile(null);
      } else {
        setUploadStatus(data.error || 'Upload failed');
      }
    } catch (err) {
      setUploadStatus('Upload error');
    }
  };

  const [trainWebStatus, setTrainWebStatus] = useState('');
  const [trainDocsStatus, setTrainDocsStatus] = useState('');
  const [trainUIStatus, setTrainUIStatus] = useState('');
  const [isTrainingWeb, setIsTrainingWeb] = useState(false);
  const [isTrainingDocs, setIsTrainingDocs] = useState(false);
  const [isTrainingUI, setIsTrainingUI] = useState(false);

  const handleTrainWeb = async () => {
    setIsTrainingWeb(true);
    setTrainWebStatus('🔄 Scraping live data from anits.org deeply... This may take a moment.');
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/train-web`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setTrainWebStatus('✅ ' + data.message);
      } else {
        setTrainWebStatus('❌ ' + (data.error || 'Training failed'));
      }
    } catch (err) {
      setTrainWebStatus('❌ Error connecting to server.');
    } finally {
      setIsTrainingWeb(false);
    }
  };

  const handleTrainDocs = async () => {
    setIsTrainingDocs(true);
    setTrainDocsStatus('🔄 Parsing uploaded PDFs and Circulars...');
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setTrainDocsStatus('✅ ' + data.message);
      } else {
        setTrainDocsStatus('❌ ' + (data.error || 'Training failed'));
      }
    } catch (err) {
      setTrainDocsStatus('❌ Error connecting to server.');
    } finally {
      setIsTrainingDocs(false);
    }
  };

  const handleTrainUI = async () => {
    setIsTrainingUI(true);
    setTrainUIStatus('🔄 Indexing local React UI codebase...');
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/train-ui`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setTrainUIStatus('✅ ' + data.message);
      } else {
        setTrainUIStatus('❌ ' + (data.error || 'Training failed'));
      }
    } catch (err) {
      setTrainUIStatus('❌ Error connecting to server.');
    } finally {
      setIsTrainingUI(false);
    }
  };

  const handleSyllabusFileChange = (e) => {
    setSyllabusFile(e.target.files[0]);
  };

  const handleSyllabusUpload = async (e) => {
    e.preventDefault();
    if (!syllabusFile) {
      setSyllabusUploadStatus('Please select a PDF file first.');
      return;
    }
    if (!syllabusProgram) {
      setSyllabusUploadStatus('Please enter a program name.');
      return;
    }
    
    setSyllabusUploadStatus('Uploading...');
    const formData = new FormData();
    formData.append('academic_year', syllabusYear);
    formData.append('program', syllabusProgram);
    formData.append('file', syllabusFile);
    
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/upload_syllabus`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      
      if (response.ok) {
        setSyllabusUploadStatus(`Upload successful! Added to ${syllabusYear}.`);
        setSyllabusFile(null);
        setSyllabusProgram('');
      } else {
        setSyllabusUploadStatus(data.error || 'Upload failed');
      }
    } catch (err) {
      setSyllabusUploadStatus('Upload error');
    }
  };

  const handlePolicyFileChange = (e) => {
    setPolicyFile(e.target.files[0]);
  };

  const handlePolicyUpload = async (e) => {
    e.preventDefault();
    if (!policyFile) {
      setPolicyUploadStatus('Please select a PDF file first.');
      return;
    }
    
    setPolicyUploadStatus('Uploading...');
    const formData = new FormData();
    formData.append('policy_name', policyName);
    formData.append('file', policyFile);
    
    const token = localStorage.getItem('adminToken');
    const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}`;
    
    try {
      const response = await fetch(`${API_URL}/api/upload_policy`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      
      if (response.ok) {
        setPolicyUploadStatus(`Upload successful! ${policyName} updated.`);
        setPolicyFile(null);
      } else {
        setPolicyUploadStatus(data.error || 'Upload failed');
      }
    } catch (err) {
      setPolicyUploadStatus('Upload error');
    }
  };

  const handleCalendarUpload = async (e) => {
    e.preventDefault();
    if (!calendarFile) {
      setCalendarUploadStatus('Please select a PDF file first.');
      return;
    }
    if (!calendarProgram) {
      setCalendarUploadStatus('Please enter a program name.');
      return;
    }
    
    setCalendarUploadStatus('Uploading...');
    const formData = new FormData();
    formData.append('academic_year_header', calendarYearHeader);
    formData.append('year', calendarYear);
    formData.append('program', calendarProgram);
    formData.append('file', calendarFile);
    
    const token = localStorage.getItem('adminToken');
    const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}`;
    try {
      const response = await fetch(`${API_URL}/api/upload_academic_calendar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      
      if (response.ok) {
        setCalendarUploadStatus(`Upload successful! Added to ${calendarYearHeader}.`);
        setCalendarFile(null);
        setCalendarProgram('');
      } else {
        setCalendarUploadStatus(data.error || 'Upload failed');
      }
    } catch (err) {
      setCalendarUploadStatus('Upload error');
    }
  };

  const handleTimeTableUpload = async (e) => {
    e.preventDefault();
    if (!timeTableFile) {
      setTimeTableUploadStatus('Please select a PDF file first.');
      return;
    }
    
    setTimeTableUploadStatus('Uploading...');
    const formData = new FormData();
    formData.append('department', timeTableDept);
    formData.append('file', timeTableFile);
    
    const token = localStorage.getItem('adminToken');
    const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}`;
    try {
      const response = await fetch(`${API_URL}/api/upload_time_table`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      
      if (response.ok) {
        setTimeTableUploadStatus(`Upload successful! Time Table updated for ${timeTableDept}.`);
        setTimeTableFile(null);
      } else {
        setTimeTableUploadStatus(data.error || 'Upload failed');
      }
    } catch (err) {
      setTimeTableUploadStatus('Upload error');
    }
  };

  const handleEventUpload = async (e) => {
    e.preventDefault();
    if (!eventTitle || !eventDate || !eventDescription) {
      setEventUploadStatus('Please fill in all event details.');
      return;
    }
    
    setEventUploadStatus('Adding event...');
    
    const token = localStorage.getItem('adminToken');
    const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}`;
    try {
      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: eventTitle,
          date: eventDate,
          description: eventDescription
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        setEventUploadStatus('Upload successful! Event added to Notice Board.');
        setEventTitle('');
        setEventDate('');
        setEventDescription('');
      } else {
        setEventUploadStatus(data.error || 'Upload failed');
      }
    } catch (err) {
      setEventUploadStatus('Upload error');
    }
  };

  const handleFacultyUpload = async (e) => {
    e.preventDefault();
    if (!facultyName || !facultyDept || !facultyDesignation) {
      setFacultyUploadStatus('Please fill in Name, Department and Designation.');
      return;
    }
    
    setFacultyUploadStatus('Adding faculty...');
    
    const token = localStorage.getItem('adminToken');
    const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}`;
    try {
      const response = await fetch(`${API_URL}/api/faculty`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: facultyName,
          department: facultyDept,
          designation: facultyDesignation,
          qualification: facultyQualification,
          email: facultyEmail
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        setFacultyUploadStatus('Upload successful! Faculty added to Directory.');
        setFacultyName('');
        setFacultyDesignation('');
        setFacultyQualification('');
        setFacultyEmail('');
      } else {
        setFacultyUploadStatus(data.error || 'Upload failed');
      }
    } catch (err) {
      setFacultyUploadStatus('Upload error');
    }
  };

  const handlePlacementUpload = async (e) => {
    e.preventDefault();
    if (!placementYear || !placementTotalOffers || !placementHighestPackage || !placementAveragePackage || !placementTotalRecruiters) {
      setPlacementUploadStatus('Please fill in all placement fields.');
      return;
    }
    
    setPlacementUploadStatus('Adding placement stats...');
    
    const token = localStorage.getItem('adminToken');
    const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}`;
    try {
      const response = await fetch(`${API_URL}/api/placements`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          year: placementYear,
          total_offers: placementTotalOffers,
          highest_package: placementHighestPackage,
          average_package: placementAveragePackage,
          total_recruiters: placementTotalRecruiters
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        setPlacementUploadStatus('Upload successful! Placement stats added.');
        setPlacementTotalOffers('');
        setPlacementHighestPackage('');
        setPlacementAveragePackage('');
        setPlacementTotalRecruiters('');
      } else {
        setPlacementUploadStatus(data.error || 'Upload failed');
      }
    } catch (err) {
      setPlacementUploadStatus('Upload error');
    }
  };

  const handleResearchUpload = async (e) => {
    e.preventDefault();
    if (!researchTitle || !researchAuthors || !researchJournal || !researchYear) {
      setResearchUploadStatus('Please fill in required fields (Title, Authors, Journal, Year).');
      return;
    }
    
    setResearchUploadStatus('Adding research publication...');
    
    const token = localStorage.getItem('adminToken');
    const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}`;
    try {
      const response = await fetch(`${API_URL}/api/research`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: researchTitle,
          authors: researchAuthors,
          journal: researchJournal,
          year: researchYear,
          link: researchLink,
          department: researchDept
        })
      });
      const data = await response.json();
      
      if (response.ok) {
        setResearchUploadStatus('Upload successful! Publication added.');
        setResearchTitle('');
        setResearchAuthors('');
        setResearchJournal('');
        setResearchYear('');
        setResearchLink('');
      } else {
        setResearchUploadStatus(data.error || 'Upload failed');
      }
    } catch (err) {
      setResearchUploadStatus('Upload error');
    }
  };

  const handleGalleryUpload = async (e) => {
    e.preventDefault();
    if (!galleryFile || !galleryTitle) {
      setGalleryUploadStatus('Please select an image and provide a title.');
      return;
    }
    
    setGalleryUploadStatus('Uploading image...');
    
    const formData = new FormData();
    formData.append('file', galleryFile);
    formData.append('title', galleryTitle);
    formData.append('category', galleryCategory);
    
    const token = localStorage.getItem('adminToken');
    const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}`;
    try {
      const response = await fetch(`${API_URL}/api/upload_gallery`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      
      if (response.ok) {
        setGalleryUploadStatus('Upload successful! Image added to Gallery.');
        setGalleryFile(null);
        setGalleryTitle('');
        // Reset file input UI manually if needed, or controlled via state
        document.getElementById('galleryFileInput').value = '';
      } else {
        setGalleryUploadStatus(data.error || 'Upload failed');
      }
    } catch (err) {
      setGalleryUploadStatus('Upload error');
    }
  };

  const handleBlogUpload = async (e) => {
    e.preventDefault();
    if (!blogTitle || !blogContent) {
      setBlogUploadStatus('Please provide a title and content.');
      return;
    }
    
    setBlogUploadStatus('Publishing post...');
    
    const formData = new FormData();
    formData.append('title', blogTitle);
    formData.append('author', blogAuthor);
    formData.append('content', blogContent);
    if (blogFile) {
      formData.append('file', blogFile);
    }
    
    const token = localStorage.getItem('adminToken');
    const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}`;
    try {
      const response = await fetch(`${API_URL}/api/upload_blog`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();
      
      if (response.ok) {
        setBlogUploadStatus('Post published successfully!');
        setBlogTitle('');
        setBlogAuthor('ANITS Admin');
        setBlogContent('');
        setBlogFile(null);
        if (document.getElementById('blogFileInput')) {
          document.getElementById('blogFileInput').value = '';
        }
      } else {
        setBlogUploadStatus(data.error || 'Upload failed');
      }
    } catch (err) {
      setBlogUploadStatus('Upload error');
    }
  };

  const handleJobUpload = async (e) => {
    e.preventDefault();
    if (!jobTitle || !jobCompany || !jobRole) {
      setJobUploadStatus('Please provide Title, Company, and Role.');
      return;
    }
    
    setJobUploadStatus('Posting job...');
    
    const payload = {
      title: jobTitle,
      company: jobCompany,
      role: jobRole,
      salary: jobSalary,
      deadline: jobDeadline,
      link: jobLink
    };
    
    const token = localStorage.getItem('adminToken');
    const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}`;
    try {
      const response = await fetch(`${API_URL}/api/jobs`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      
      if (response.ok) {
        setJobUploadStatus('Job posted successfully!');
        setJobTitle('');
        setJobCompany('');
        setJobRole('');
        setJobSalary('');
        setJobDeadline('');
        setJobLink('');
      } else {
        setJobUploadStatus(data.error || 'Upload failed');
      }
    } catch (err) {
      setJobUploadStatus('Upload error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/';
  }

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMessage) {
      setBroadcastStatus('Please enter a message to broadcast.');
      return;
    }
    
    setIsBroadcasting(true);
    setBroadcastStatus('Sending broadcast to all Telegram users...');
    
    const token = localStorage.getItem('adminToken');
    const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
    try {
      const response = await fetch(`${API_URL}/api/admin/broadcast`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: broadcastMessage })
      });
      const data = await response.json();
      
      if (response.ok) {
        setBroadcastStatus('✅ ' + data.message);
        setBroadcastMessage('');
      } else {
        setBroadcastStatus('❌ ' + (data.error || 'Broadcast failed'));
      }
    } catch (err) {
      setBroadcastStatus('❌ Error connecting to server.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    if (!newFacultyEmail || !newFacultyPassword || !newFacultyName) {
      setNewFacultyStatus('❌ Please fill all required fields');
      return;
    }
    setIsCreatingNewFaculty(true);
    setNewFacultyStatus('Creating account...');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
      const response = await fetch(`${API_URL}/api/admin/create-faculty`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          email: newFacultyEmail,
          password: newFacultyPassword,
          name: newFacultyName,
          department: newFacultyDept
        })
      });
      const data = await response.json();
      if (response.ok) {
        setNewFacultyStatus('✅ ' + data.message);
        setNewFacultyEmail('');
        setNewFacultyPassword('');
        setNewFacultyName('');
      } else {
        setNewFacultyStatus('❌ ' + (data.error || 'Failed to create faculty'));
      }
    } catch (err) {
      setNewFacultyStatus('❌ Server error');
    }
    setIsCreatingNewFaculty(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[52px] font-sans pb-16">
      <Helmet>
        <title>Dashboard | Admin Portal</title>
      </Helmet>

      {/* Header */}
      <header className="bg-gray-900 text-white py-12 px-6 shadow-md mb-12">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-400 font-medium mt-1">Manage ANITS Chatbot Knowledge & Logs</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors font-medium border border-red-600/30"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        
        {/* Universal Data Uploader Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden relative mb-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="border-b border-gray-100 p-6 bg-emerald-50/30 flex items-center gap-3">
            <Database className="text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-900">Universal Student Data Ingestion</h2>
          </div>
          
          <div className="p-8 grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <p className="text-gray-600 text-sm">
                Upload <strong>CSV, Excel (.xlsx, .xls), PDF, Word (.docx), TXT, or JSON</strong> files containing student details. 
                Our Gemini AI will automatically extract unstructured data from documents directly into MongoDB!
              </p>
              
              <form onSubmit={handleStudentUpload} className="flex flex-col gap-4">
                <input 
                  type="file" 
                  id="studentFileInput"
                  accept=".csv, .xlsx, .xls, .pdf, .docx, .txt, .json" 
                  onChange={(e) => setStudentFile(e.target.files[0])} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer border border-gray-200 rounded-xl"
                />
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${studentUploadStatus.includes('❌') ? 'text-red-500' : 'text-green-600'}`}>
                    {studentUploadStatus}
                  </span>
                  <button 
                    type="submit" 
                    className="whitespace-nowrap px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                  >
                    <UploadCloud size={18} /> Upload Data
                  </button>
                </div>
              </form>
            </div>
            
            {/* Dynamic Schema Manager */}
            <div className="border-l border-gray-100 pl-8 space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <CheckCircle size={18} className="text-emerald-500" /> Dynamic Schema Manager
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Below are all the unique columns currently extracted in your database. 
                Click delete to wipe useless data from all student records instantly.
              </p>
              
              <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
                {studentFields.map(field => (
                  <div key={field} className="group flex items-center gap-2 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-transparent hover:border-red-200">
                    <span>{field}</span>
                    <button 
                      type="button"
                      onClick={() => handleDeleteField(field)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      title={`Delete ${field} from database`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {studentFields.length === 0 && (
                  <div className="text-sm text-gray-400 italic">No custom fields detected yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Broadcast Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-blue-100 overflow-hidden relative mb-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
          <div className="border-b border-gray-100 p-6 bg-blue-50/30 flex items-center gap-3">
            <Megaphone className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Broadcast to Students</h2>
          </div>
          
          <div className="p-8 space-y-6">
            <p className="text-gray-600 text-sm">Send an instant announcement to all students who have interacted with the Telegram Bot.</p>
            
            <form onSubmit={handleBroadcast} className="flex flex-col gap-4">
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Write your announcement here... (Markdown supported)"
                className="w-full h-32 p-4 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none placeholder-gray-400"
              />
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${broadcastStatus.includes('❌') ? 'text-red-500' : 'text-green-600'}`}>
                  {broadcastStatus}
                </span>
                <button 
                  type="submit" 
                  disabled={isBroadcasting}
                  className={`flex items-center gap-2 px-6 py-2.5 font-bold rounded-xl transition-all shadow-sm ${isBroadcasting ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white hover:-translate-y-0.5'}`}
                >
                  <Send size={18} /> {isBroadcasting ? 'Sending...' : 'Send Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Manage Faculty Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-emerald-100 overflow-hidden relative mb-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="border-b border-gray-100 p-6 bg-emerald-50/30 flex items-center gap-3">
            <Users className="text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-900">Manage Faculty Accounts</h2>
          </div>
          
          <div className="p-8 space-y-6">
            <p className="text-gray-600 text-sm">Create accounts for faculty members to access the Faculty Portal and broadcast emails.</p>
            
            <form onSubmit={handleCreateFaculty} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  value={newFacultyName}
                  onChange={(e) => setNewFacultyName(e.target.value)}
                  placeholder="Full Name (e.g., Dr. Smith)"
                  className="w-full p-3 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <select
                  value={newFacultyDept}
                  onChange={(e) => setNewFacultyDept(e.target.value)}
                  className="w-full p-3 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {deptsList.map((d, i) => <option key={i} value={d}>{d}</option>)}
                </select>
                <input
                  type="email"
                  required
                  value={newFacultyEmail}
                  onChange={(e) => setNewFacultyEmail(e.target.value)}
                  placeholder="Email Address"
                  className="w-full p-3 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <input
                  type="password"
                  required
                  value={newFacultyPassword}
                  onChange={(e) => setNewFacultyPassword(e.target.value)}
                  placeholder="Temporary Password"
                  className="w-full p-3 border border-gray-200 bg-white text-gray-900 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              
              <div className="flex justify-between items-center mt-2">
                <span className={`text-sm font-medium ${newFacultyStatus.includes('❌') ? 'text-red-500' : 'text-green-600'}`}>
                  {newFacultyStatus}
                </span>
                <button 
                  type="submit" 
                  disabled={isCreatingNewFaculty}
                  className={`flex items-center gap-2 px-6 py-2.5 font-bold rounded-xl transition-all shadow-sm ${isCreatingNewFaculty ? 'bg-emerald-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:-translate-y-0.5'}`}
                >
                  <Plus size={18} /> {isCreatingNewFaculty ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* AI Model Management Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-purple-100 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-500"></div>
          <div className="border-b border-gray-100 p-6 bg-purple-50/30 flex items-center gap-3">
            <Microscope className="text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Selective AI Training</h2>
          </div>
          
          <div className="p-8 space-y-6">
            <p className="text-gray-600 text-sm">Selectively train the chatbot on specific data sources to prevent unnecessary lag and keep it blazing fast.</p>
            
            {/* Train Web */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
              <div>
                <p className="text-gray-800 font-bold mb-1">1. Train on Official Website (anits.org)</p>
                <p className="text-gray-500 text-xs">Recursively scrapes and indexes live pages from the official website.</p>
              </div>
              <button onClick={handleTrainWeb} disabled={isTrainingWeb} className={`whitespace-nowrap px-6 py-2 font-bold rounded-lg transition-all shadow-sm ${isTrainingWeb ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white hover:-translate-y-0.5'}`}>
                {isTrainingWeb ? 'Scraping...' : 'Start Web Scrape'}
              </button>
            </div>
            {trainWebStatus && <div className="text-sm font-medium text-purple-700 px-4">{trainWebStatus}</div>}
            
            {/* Train Docs */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
              <div>
                <p className="text-gray-800 font-bold mb-1">2. Train on PDFs & Docs</p>
                <p className="text-gray-500 text-xs">Parses all uploaded Circulars, Syllabuses, and Policies.</p>
              </div>
              <button onClick={handleTrainDocs} disabled={isTrainingDocs} className={`whitespace-nowrap px-6 py-2 font-bold rounded-lg transition-all shadow-sm ${isTrainingDocs ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:-translate-y-0.5'}`}>
                {isTrainingDocs ? 'Parsing...' : 'Process Documents'}
              </button>
            </div>
            {trainDocsStatus && <div className="text-sm font-medium text-indigo-700 px-4">{trainDocsStatus}</div>}
            
            {/* Train UI */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50">
              <div>
                <p className="text-gray-800 font-bold mb-1">3. Train on Local Codebase</p>
                <p className="text-gray-500 text-xs">Indexes the React UI source code. Only needed if the bot must answer developer questions.</p>
              </div>
              <button onClick={handleTrainUI} disabled={isTrainingUI} className={`whitespace-nowrap px-6 py-2 font-bold rounded-lg transition-all shadow-sm ${isTrainingUI ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-900 text-white hover:-translate-y-0.5'}`}>
                {isTrainingUI ? 'Indexing...' : 'Index Codebase'}
              </button>
            </div>
            {trainUIStatus && <div className="text-sm font-medium text-gray-700 px-4">{trainUIStatus}</div>}

          </div>
        </div>

        {/* Upload Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 p-6 bg-gray-50/50 flex items-center gap-3">
            <UploadCloud className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Upload Circulars</h2>
          </div>
          <div className="p-8">
            <p className="text-gray-600 mb-6 font-medium">Upload a PDF circular. The chatbot will instantly process the text and be able to answer questions regarding it.</p>
            
            <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange} 
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all cursor-pointer border border-gray-200 rounded-xl"
              />
              <button 
                type="submit" 
                className="whitespace-nowrap px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md"
              >
                Upload Document
              </button>
            </form>

            {uploadStatus && (
              <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 font-medium animate-fade-in ${uploadStatus.includes('successful') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {uploadStatus.includes('successful') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {uploadStatus}
              </div>
            )}
          </div>
        </div>

        {/* Syllabus Upload Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 p-6 bg-gray-50/50 flex items-center gap-3">
            <BookOpen className="text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Manage Syllabus Downloads</h2>
          </div>
          <div className="p-8">
            <p className="text-gray-600 mb-6 font-medium">Upload syllabus PDFs. They will immediately appear on the public Syllabus & Downloads page under the selected Academic Year.</p>
            
            <form onSubmit={handleSyllabusUpload} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Academic Year</label>
                  <select 
                    value={syllabusYear}
                    onChange={(e) => setSyllabusYear(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="Academic Year 2025-26">Academic Year 2025-26</option>
                    <option value="Academic Year 2024-25">Academic Year 2024-25</option>
                    <option value="Academic Year 2023-24">Academic Year 2023-24</option>
                    <option value="Academic Year 2022-23">Academic Year 2022-23</option>
                    <option value="Academic Year 2021-22">Academic Year 2021-22</option>
                    <option value="Academic Year 2020-21">Academic Year 2020-21</option>
                    <option value="Academic Year 2019-20">Academic Year 2019-20</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Program Name</label>
                  <input 
                    type="text" 
                    value={syllabusProgram}
                    onChange={(e) => setSyllabusProgram(e.target.value)}
                    placeholder="e.g. First Year UG Courses"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mt-2">
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handleSyllabusFileChange} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-all cursor-pointer border border-gray-200 rounded-xl"
                />
                <button 
                  type="submit" 
                  className="whitespace-nowrap px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors shadow-md"
                >
                  Upload Syllabus
                </button>
              </div>
            </form>

            {syllabusUploadStatus && (
              <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 font-medium animate-fade-in ${syllabusUploadStatus.includes('successful') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {syllabusUploadStatus.includes('successful') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {syllabusUploadStatus}
              </div>
            )}
          </div>
        </div>

        {/* Policy Upload Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 p-6 bg-gray-50/50 flex items-center gap-3">
            <FileText className="text-emerald-600" />
            <h2 className="text-xl font-bold text-gray-900">Manage College Policies</h2>
          </div>
          <div className="p-8">
            <p className="text-gray-600 mb-6 font-medium">Upload policy PDFs. They will immediately appear on the public Policies page as clickable View links.</p>
            
            <form onSubmit={handlePolicyUpload} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Policy</label>
                  <select 
                    value={policyName}
                    onChange={(e) => setPolicyName(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  >
                    {policiesList.map((policy, idx) => (
                      <option key={idx} value={policy}>{policy}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mt-2">
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={handlePolicyFileChange} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-all cursor-pointer border border-gray-200 rounded-xl"
                />
                <button 
                  type="submit" 
                  className="whitespace-nowrap px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-md"
                >
                  Upload Policy
                </button>
              </div>
            </form>

            {policyUploadStatus && (
              <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 font-medium animate-fade-in ${policyUploadStatus.includes('successful') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {policyUploadStatus.includes('successful') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {policyUploadStatus}
              </div>
            )}
          </div>
        </div>

        {/* Academic Calendar Upload Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 p-6 bg-gray-50/50 flex items-center gap-3">
            <BookOpen className="text-teal-600" />
            <h2 className="text-xl font-bold text-gray-900">Manage Academic Calendar</h2>
          </div>
          <div className="p-8">
            <p className="text-gray-600 mb-6 font-medium">Upload Academic Calendar PDFs. They will appear dynamically on the Academic Calendar page.</p>
            
            <form onSubmit={handleCalendarUpload} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Year Header</label>
                  <select 
                    value={calendarYearHeader}
                    onChange={(e) => setCalendarYearHeader(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="Academic Year 2025-26">Academic Year 2025-26</option>
                    <option value="Academic Year 2024-25">Academic Year 2024-25</option>
                    <option value="Academic Year 2023-24">Academic Year 2023-24</option>
                    <option value="Academic Year 2022-23">Academic Year 2022-23</option>
                    <option value="Academic Year 2021-22">Academic Year 2021-22</option>
                    <option value="Academic Year 2020-21">Academic Year 2020-21</option>
                    <option value="Academic Year 2019-20">Academic Year 2019-20</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Year (Row)</label>
                  <input 
                    type="text" 
                    value={calendarYear}
                    onChange={(e) => setCalendarYear(e.target.value)}
                    placeholder="e.g. 2025-26"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Program Name</label>
                  <input 
                    type="text" 
                    value={calendarProgram}
                    onChange={(e) => setCalendarProgram(e.target.value)}
                    placeholder="e.g. First Year UG Courses"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mt-2">
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={(e) => setCalendarFile(e.target.files[0])} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 transition-all cursor-pointer border border-gray-200 rounded-xl"
                />
                <button 
                  type="submit" 
                  className="whitespace-nowrap px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors shadow-md"
                >
                  Upload Calendar
                </button>
              </div>
            </form>

            {calendarUploadStatus && (
              <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 font-medium animate-fade-in ${calendarUploadStatus.includes('successful') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {calendarUploadStatus.includes('successful') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {calendarUploadStatus}
              </div>
            )}
          </div>
        </div>

        {/* Time Tables Upload Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 p-6 bg-gray-50/50 flex items-center gap-3">
            <FileText className="text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">Manage Time Tables</h2>
          </div>
          <div className="p-8">
            <p className="text-gray-600 mb-6 font-medium">Upload Time Tables for each department. They will update on the Time Tables page.</p>
            
            <form onSubmit={handleTimeTableUpload} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Select Department</label>
                  <select 
                    value={timeTableDept}
                    onChange={(e) => setTimeTableDept(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  >
                    {deptsList.map((dept, idx) => (
                      <option key={idx} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mt-2">
                <input 
                  type="file" 
                  accept=".pdf" 
                  onChange={(e) => setTimeTableFile(e.target.files[0])} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 transition-all cursor-pointer border border-gray-200 rounded-xl"
                />
                <button 
                  type="submit" 
                  className="whitespace-nowrap px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors shadow-md"
                >
                  Upload Time Table
                </button>
              </div>
            </form>

            {timeTableUploadStatus && (
              <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 font-medium animate-fade-in ${timeTableUploadStatus.includes('successful') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {timeTableUploadStatus.includes('successful') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {timeTableUploadStatus}
              </div>
            )}
          </div>
        </div>

        {/* Notice Board & Events Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 p-6 bg-gray-50/50 flex items-center gap-3">
            <Bell className="text-pink-600" />
            <h2 className="text-xl font-bold text-gray-900">Manage Notice Board & Events</h2>
          </div>
          <div className="p-8">
            <p className="text-gray-600 mb-6 font-medium">Add new events or notices here. They will instantly appear on the public Home Page.</p>
            
            <form onSubmit={handleEventUpload} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Event Title</label>
                  <input 
                    type="text" 
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="e.g. Annual Tech Fest 2026"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Event Date / Deadline</label>
                  <input 
                    type="text" 
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    placeholder="e.g. Oct 15, 2026"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <textarea 
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Provide details about the event or notice..."
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all min-h-[100px]"
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-2">
                <button 
                  type="submit" 
                  className="whitespace-nowrap px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl transition-colors shadow-md"
                >
                  Publish to Notice Board
                </button>
              </div>
            </form>

            {eventUploadStatus && (
              <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 font-medium animate-fade-in ${eventUploadStatus.includes('successful') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {eventUploadStatus.includes('successful') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {eventUploadStatus}
              </div>
            )}
          </div>
        </div>

        {/* Faculty Directory Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 p-6 bg-gray-50/50 flex items-center gap-3">
            <Users className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Manage Faculty Directory</h2>
          </div>
          <div className="p-8">
            <p className="text-gray-600 mb-6 font-medium">Add faculty profiles here. They will appear on the public Faculty Directory.</p>
            
            <form onSubmit={handleFacultyUpload} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Faculty Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={facultyName}
                    onChange={(e) => setFacultyName(e.target.value)}
                    placeholder="e.g. Dr. John Doe"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Department <span className="text-red-500">*</span></label>
                  <select 
                    value={facultyDept}
                    onChange={(e) => setFacultyDept(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  >
                    {deptsList.map((dept, idx) => (
                      <option key={idx} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Designation <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={facultyDesignation}
                    onChange={(e) => setFacultyDesignation(e.target.value)}
                    placeholder="e.g. Professor / Asst. Professor"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Qualifications</label>
                  <input 
                    type="text" 
                    value={facultyQualification}
                    onChange={(e) => setFacultyQualification(e.target.value)}
                    placeholder="e.g. Ph.D, M.Tech"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={facultyEmail}
                    onChange={(e) => setFacultyEmail(e.target.value)}
                    placeholder="e.g. professor@anits.edu.in"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-2">
                <button 
                  type="submit" 
                  className="whitespace-nowrap px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md"
                >
                  Add to Directory
                </button>
              </div>
            </form>

            {facultyUploadStatus && (
              <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 font-medium animate-fade-in ${facultyUploadStatus.includes('successful') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {facultyUploadStatus.includes('successful') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {facultyUploadStatus}
              </div>
            )}
          </div>
        </div>

        {/* Placements Data Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 p-6 bg-gray-50/50 flex items-center gap-3">
            <TrendingUp className="text-green-600" />
            <h2 className="text-xl font-bold text-gray-900">Manage Placements Statistics</h2>
          </div>
          <div className="p-8">
            <p className="text-gray-600 mb-6 font-medium">Add yearly placement highlights here. They will automatically appear on the Placements page.</p>
            
            <form onSubmit={handlePlacementUpload} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Academic Year <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={placementYear}
                    onChange={(e) => setPlacementYear(e.target.value)}
                    placeholder="e.g. Placement Highlights 2025"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Total Offers <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={placementTotalOffers}
                    onChange={(e) => setPlacementTotalOffers(e.target.value)}
                    placeholder="e.g. 1065+"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Highest Package <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={placementHighestPackage}
                    onChange={(e) => setPlacementHighestPackage(e.target.value)}
                    placeholder="e.g. 12 LPA"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Average Package <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={placementAveragePackage}
                    onChange={(e) => setPlacementAveragePackage(e.target.value)}
                    placeholder="e.g. 5.06 LPA"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Total Recruiters <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={placementTotalRecruiters}
                    onChange={(e) => setPlacementTotalRecruiters(e.target.value)}
                    placeholder="e.g. 62"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-2">
                <button 
                  type="submit" 
                  className="whitespace-nowrap px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors shadow-md"
                >
                  Save Statistics
                </button>
              </div>
            </form>

            {placementUploadStatus && (
              <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 font-medium animate-fade-in ${placementUploadStatus.includes('successful') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {placementUploadStatus.includes('successful') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {placementUploadStatus}
              </div>
            )}
          </div>
        </div>

        {/* Research & Development Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 p-6 bg-gray-50/50 flex items-center gap-3">
            <Microscope className="text-indigo-500" />
            <h2 className="text-xl font-bold text-gray-900">Manage R&D Publications</h2>
          </div>
          <div className="p-8">
            <p className="text-gray-600 mb-6 font-medium">Add research publications here. They will automatically appear on the R&D page.</p>
            
            <form onSubmit={handleResearchUpload} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Paper Title <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={researchTitle}
                    onChange={(e) => setResearchTitle(e.target.value)}
                    placeholder="e.g. A Novel Approach to AI..."
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Authors <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={researchAuthors}
                    onChange={(e) => setResearchAuthors(e.target.value)}
                    placeholder="e.g. John Doe, Jane Smith"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Journal/Conference <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={researchJournal}
                    onChange={(e) => setResearchJournal(e.target.value)}
                    placeholder="e.g. IEEE Transactions"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Year <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={researchYear}
                    onChange={(e) => setResearchYear(e.target.value)}
                    placeholder="e.g. 2024"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Department</label>
                  <select 
                    value={researchDept}
                    onChange={(e) => setResearchDept(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="General">General / Cross-Disciplinary</option>
                    {deptsList.map((dept, idx) => (
                      <option key={idx} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Link/DOI (Optional)</label>
                  <input 
                    type="text" 
                    value={researchLink}
                    onChange={(e) => setResearchLink(e.target.value)}
                    placeholder="e.g. https://doi.org/..."
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-2">
                <button 
                  type="submit" 
                  className="whitespace-nowrap px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md"
                >
                  Add Publication
                </button>
              </div>
            </form>

            {researchUploadStatus && (
              <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 font-medium animate-fade-in ${researchUploadStatus.includes('successful') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {researchUploadStatus.includes('successful') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {researchUploadStatus}
              </div>
            )}
          </div>
        </div>

        {/* Gallery Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 p-6 bg-gray-50/50 flex items-center gap-3">
            <ImageIcon className="text-pink-500" />
            <h2 className="text-xl font-bold text-gray-900">Manage Photo Gallery</h2>
          </div>
          <div className="p-8">
            <p className="text-gray-600 mb-6 font-medium">Upload photos to the public gallery.</p>
            
            <form onSubmit={handleGalleryUpload} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Image Title <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={galleryTitle}
                    onChange={(e) => setGalleryTitle(e.target.value)}
                    placeholder="e.g. Annual Sports Day 2024"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                  <select 
                    value={galleryCategory}
                    onChange={(e) => setGalleryCategory(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="Campus">Campus</option>
                    <option value="Events">Events & Fests</option>
                    <option value="Workshops">Workshops & Seminars</option>
                    <option value="Sports">Sports</option>
                    <option value="Hostel">Hostel & Facilities</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Upload Image <span className="text-red-500">*</span></label>
                  <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 hover:border-pink-500 rounded-xl bg-gray-50 hover:bg-pink-50 transition-colors">
                    <input 
                      type="file" 
                      id="galleryFileInput"
                      onChange={(e) => setGalleryFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                    />
                    <div className="p-8 text-center flex flex-col items-center">
                      <ImageIcon className="text-gray-400 group-hover:text-pink-500 mb-3" size={32} />
                      <p className="text-gray-600 font-medium group-hover:text-pink-600 transition-colors">
                        {galleryFile ? galleryFile.name : "Click or drag image file here"}
                      </p>
                      {!galleryFile && <p className="text-sm text-gray-400 mt-2">Supports JPG, PNG, WEBP</p>}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-2">
                <button 
                  type="submit" 
                  className="whitespace-nowrap px-8 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl transition-colors shadow-md"
                >
                  Upload Image
                </button>
              </div>
            </form>

            {galleryUploadStatus && (
              <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 font-medium animate-fade-in ${galleryUploadStatus.includes('successful') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {galleryUploadStatus.includes('successful') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {galleryUploadStatus}
              </div>
            )}
          </div>
        </div>

        {/* Blog/News Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 p-6 bg-gray-50/50 flex items-center gap-3">
            <FileText className="text-indigo-500" />
            <h2 className="text-xl font-bold text-gray-900">Manage College News & Blogs</h2>
          </div>
          <div className="p-8">
            <p className="text-gray-600 mb-6 font-medium">Publish news, announcements, or student blog posts.</p>
            
            <form onSubmit={handleBlogUpload} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Post Title <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    placeholder="e.g. ANITS Hackathon 2024 Winners"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Author</label>
                  <input 
                    type="text" 
                    value={blogAuthor}
                    onChange={(e) => setBlogAuthor(e.target.value)}
                    placeholder="e.g. CSE Department"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Content <span className="text-red-500">*</span></label>
                  <textarea 
                    value={blogContent}
                    onChange={(e) => setBlogContent(e.target.value)}
                    placeholder="Write the full news article or blog post content here..."
                    rows="6"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                  ></textarea>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Cover Image (Optional)</label>
                  <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors">
                    <input 
                      type="file" 
                      id="blogFileInput"
                      onChange={(e) => setBlogFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                    />
                    <div className="p-8 text-center flex flex-col items-center">
                      <ImageIcon className="text-gray-400 group-hover:text-indigo-500 mb-3" size={32} />
                      <p className="text-gray-600 font-medium group-hover:text-indigo-600 transition-colors">
                        {blogFile ? blogFile.name : "Click or drag a cover image here"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end mt-2">
                <button 
                  type="submit" 
                  className="whitespace-nowrap px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md"
                >
                  Publish Post
                </button>
              </div>
            </form>

            {blogUploadStatus && (
              <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 font-medium animate-fade-in ${blogUploadStatus.includes('successful') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {blogUploadStatus.includes('successful') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {blogUploadStatus}
              </div>
            )}
          </div>
        </div>

        {/* Jobs & Opportunities Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 p-6 bg-gray-50/50 flex items-center gap-3">
            <Briefcase className="text-teal-500" />
            <h2 className="text-xl font-bold text-gray-900">Manage Job Board</h2>
          </div>
          <div className="p-8">
            <p className="text-gray-600 mb-6 font-medium">Post new internships or full-time opportunities for students.</p>
            
            <form onSubmit={handleJobUpload} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Job Title / Program <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Summer Internship 2024"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Company <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={jobCompany}
                    onChange={(e) => setJobCompany(e.target.value)}
                    placeholder="e.g. Google, Amazon, TCS"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Role/Position <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. SDE Intern"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Salary/Stipend</label>
                  <input 
                    type="text" 
                    value={jobSalary}
                    onChange={(e) => setJobSalary(e.target.value)}
                    placeholder="e.g. 10 LPA / 50k per month"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Application Deadline</label>
                  <input 
                    type="text" 
                    value={jobDeadline}
                    onChange={(e) => setJobDeadline(e.target.value)}
                    placeholder="e.g. 25th Oct 2024"
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Application Link</label>
                  <input 
                    type="text" 
                    value={jobLink}
                    onChange={(e) => setJobLink(e.target.value)}
                    placeholder="e.g. https://careers.google.com/..."
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 font-medium focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="flex justify-end mt-2">
                <button 
                  type="submit" 
                  className="whitespace-nowrap px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors shadow-md"
                >
                  Post Job
                </button>
              </div>
            </form>

            {jobUploadStatus && (
              <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 font-medium animate-fade-in ${jobUploadStatus.includes('successful') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                {jobUploadStatus.includes('successful') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                {jobUploadStatus}
              </div>
            )}
          </div>
        </div>

        {/* Analytics Card */}
        {analytics && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="border-b border-gray-100 p-6 bg-gray-50/50 flex items-center gap-3">
              <TrendingUp className="text-orange-600" />
              <h2 className="text-xl font-bold text-gray-900">Chatbot Analytics</h2>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Language Usage</h3>
                <ul className="space-y-3">
                  {Object.entries(analytics.language_usage).map(([lang, count]) => (
                    <li key={lang} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="font-bold text-gray-700">{lang}</span>
                      <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-bold">{count}</span>
                    </li>
                  ))}
                  {Object.keys(analytics.language_usage).length === 0 && (
                    <li className="text-gray-500 font-medium">No language data available.</li>
                  )}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Top Questions</h3>
                <ul className="space-y-3">
                  {Object.entries(analytics.frequent_questions).map(([question, count]) => (
                    <li key={question} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="font-medium text-gray-700 truncate mr-4">{question}</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">{count}</span>
                    </li>
                  ))}
                  {Object.keys(analytics.frequent_questions).length === 0 && (
                    <li className="text-gray-500 font-medium">No question data available.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Logs Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 p-6 bg-gray-50/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <MessageSquare className="text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">Live Chatbot Logs</h2>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleExportPDF}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-sm text-sm"
              >
                Download PDF
              </button>
              <button 
                onClick={handleExportCSV}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm text-sm"
              >
                Export CSV
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider font-bold border-b border-gray-200">
                  <th className="p-4 pl-8">Timestamp</th>
                  <th className="p-4 w-1/3">User Message</th>
                  <th className="p-4 w-1/3">Bot Reply</th>
                  <th className="p-4 pr-8">Lang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="p-4 pl-8 text-gray-500 font-medium whitespace-nowrap">{log.timestamp}</td>
                    <td className="p-4 text-gray-900 font-medium">{log.user_message}</td>
                    <td className="p-4 text-gray-600">{log.bot_reply}</td>
                    <td className="p-4 pr-8">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                        {log.language}
                      </span>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-gray-500 font-medium">
                      No chat logs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enquiries Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-100 p-6 bg-gray-50/50 flex items-center gap-3">
            <Mail className="text-cyan-600" />
            <h2 className="text-xl font-bold text-gray-900">Contact & Admissions Enquiries</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider font-bold border-b border-gray-200">
                  <th className="p-4 pl-8">Date</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Subject</th>
                  <th className="p-4 pr-8">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {enquiries.map((eq) => (
                  <tr key={eq.id || eq._id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="p-4 pl-8 text-gray-500 font-medium whitespace-nowrap">
                      {new Date(eq.timestamp).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-gray-900 font-bold">{eq.name}</td>
                    <td className="p-4 text-gray-600">
                      <div>{eq.email}</div>
                      {eq.phone && <div className="text-xs text-gray-400 mt-1">{eq.phone}</div>}
                    </td>
                    <td className="p-4 text-gray-800 font-medium">{eq.subject || '-'}</td>
                    <td className="p-4 pr-8 text-gray-600 max-w-md truncate" title={eq.message}>
                      {eq.message}
                    </td>
                  </tr>
                ))}
                {enquiries.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-gray-500 font-medium">
                      No enquiries received yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
