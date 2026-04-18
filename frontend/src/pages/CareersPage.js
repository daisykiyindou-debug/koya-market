import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Briefcase, MapPin, Clock, ArrowLeft, CheckCircle, Banknote, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CareersPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', position: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (jobId && jobs.length > 0) {
      const job = jobs.find(j => j.id === jobId);
      setSelectedJob(job || null);
    } else {
      setSelectedJob(null);
    }
  }, [jobId, jobs]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API}/jobs`);
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      toast.success('Candidature envoyée !', { description: 'Nous examinerons votre profil et vous recontacterons.' });
      setFormData({ name: '', email: '', phone: '', position: '', message: '' });
      setSubmitting(false);
    }, 1000);
  };

  // Job Detail View
  if (selectedJob) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-primary text-white py-12">
          <div className="container-custom">
            <Button variant="ghost" className="text-white mb-4 hover:bg-white/20" onClick={() => navigate('/carrieres')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Toutes les offres
            </Button>
            <div className="flex items-center gap-3 text-white/70 text-sm mb-2">
              <span className="px-2 py-1 bg-white/20 rounded-full">{selectedJob.department}</span>
              <span>{selectedJob.type}</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-semibold mb-2">{selectedJob.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80 mt-4">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedJob.location}</span>
              <span className="flex items-center gap-1"><Banknote className="w-4 h-4" /> {selectedJob.salary}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {selectedJob.type}</span>
            </div>
          </div>
        </div>

        <div className="container-custom py-8 md:py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="bg-white rounded-2xl p-6 border">
                <h2 className="font-heading text-xl font-semibold mb-4">Description du poste</h2>
                <p className="text-muted-foreground">{selectedJob.description}</p>
              </div>

              {/* Missions */}
              <div className="bg-white rounded-2xl p-6 border">
                <h2 className="font-heading text-xl font-semibold mb-4">Missions</h2>
                <ul className="space-y-3">
                  {selectedJob.missions.map((mission, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span>{mission}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirements */}
              <div className="bg-white rounded-2xl p-6 border">
                <h2 className="font-heading text-xl font-semibold mb-4">Profil recherché</h2>
                <ul className="space-y-3">
                  {selectedJob.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Benefits */}
              <div className="bg-white rounded-2xl p-6 border">
                <h2 className="font-heading text-xl font-semibold mb-4">Avantages</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {selectedJob.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-primary" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Apply */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-2xl p-6 border">
                <h3 className="font-heading text-lg font-semibold mb-2">Postuler</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Banknote className="w-4 h-4" />
                  <span>{selectedJob.salary}</span>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Nom complet *" className="form-input text-sm" required data-testid="job-apply-name" />
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Email *" className="form-input text-sm" required data-testid="job-apply-email" />
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Téléphone *" className="form-input text-sm" required />
                  <div>
                    <label className="form-label text-sm">CV (PDF)</label>
                    <input type="file" accept=".pdf,.doc,.docx" className="form-input text-sm file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:bg-primary/10 file:text-primary" data-testid="job-cv-upload" />
                  </div>
                  <textarea value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} placeholder="Motivation..." className="form-input text-sm min-h-[80px]" />
                  <Button type="submit" className="w-full btn-primary" disabled={submitting} data-testid="job-apply-btn">
                    {submitting ? 'Envoi...' : 'Envoyer ma candidature'}
                    <Send className="w-4 h-4 ml-2" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Jobs List View
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-white py-16">
        <div className="container-custom text-center">
          <h1 className="font-heading text-3xl md:text-4xl font-semibold mb-4">Rejoignez l'équipe KÔYA</h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Participez à l'aventure KÔYA Market et contribuez à rendre les produits afro-caraïbéens accessibles à tous.
          </p>
        </div>
      </div>

      <div className="container-custom py-12">
        {/* Job Listings - Full Width */}
        <h2 className="font-heading text-2xl font-semibold mb-6">Nos offres d'emploi</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {jobs.map((position) => (
            <div
              key={position.id}
              className="bg-white rounded-2xl p-6 border border-border hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/carrieres/${position.id}`)}
              data-testid={`job-${position.id}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">{position.department}</span>
                  <h3 className="font-heading text-lg font-semibold mt-2 mb-1">{position.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{position.location}</span>
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{position.type}</span>
                    <span className="flex items-center gap-1"><Banknote className="w-4 h-4" />{position.salary}</span>
                  </div>
                </div>
                <Briefcase className="w-10 h-10 text-primary/20 shrink-0" />
              </div>
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{position.description}</p>
              <Button variant="outline" size="sm" className="mt-4">Voir l'offre</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CareersPage;
