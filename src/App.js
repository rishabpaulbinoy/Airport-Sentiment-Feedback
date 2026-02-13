import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, CheckCircle, UtensilsCrossed, ShieldCheck, User, Phone, Mail, ArrowLeft, Star, PlaneTakeoff, Sofa, Info, UserCheck } from 'lucide-react';

export default function App() {
  const [page, setPage] = useState(1);
  const [rating, setRating] = useState(3);
  const [selectedCats, setSelectedCats] = useState([]);
  const [userData, setUserData] = useState({ name: '', phone: '', email: '', comments: '' });
  const [isSending, setIsSending] = useState(false);

  // 1. DYNAMIC THEME & FLIGHT LOGIC
  const getRatingTheme = () => {
    if (rating <= 2) return { color: '#ef4444' };
    if (rating === 3) return { color: '#f59e0b' };
    return { color: '#10b981' };
  };

  const getPlaneStyles = () => {
    if (rating === 1) return { y: -50, rotate: -15 };
    if (rating === 2) return { y: -25, rotate: -30 };
    if (rating === 3) return { y: 0, rotate: -45 };
    if (rating === 4) return { y: -25, rotate: -60 };
    return { y: -50, rotate: -90 };
  };

  const theme = getRatingTheme();
  const planeMotion = getPlaneStyles();

  const categories = [
    { id: 'Check-in & Immigration', icon: <PlaneTakeoff size={24}/> },
    { id: 'Comfort & Facilities', icon: <Sofa size={24}/> },
    { id: 'Information & Communication', icon: <Info size={24}/> },
    { id: 'Service Quality & Staff', icon: <UserCheck size={24}/> },
    { id: 'Safety & Security', icon: <ShieldCheck size={24}/> },
    { id: 'Retail & Food Services', icon: <UtensilsCrossed size={24}/> },
  ];

  // 2. VALIDATION & HANDLERS
  const isNameValid = userData.name.length >= 8;
  const isPhoneValid = userData.phone.length >= 7; 
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email);
  const isFormValid = isNameValid && isPhoneValid && isEmailValid;

  const handleInput = (e) => {
    const { name, value } = e.target;
    const filtered = name === "name" ? value.replace(/[^A-Za-z\s]/g, "") : 
                     name === "phone" ? value.replace(/\D/g, "") : value;
    setUserData(prev => ({ ...prev, [name]: filtered }));
  };

  // 3. BACKEND INTEGRATION (Node.js + PostgreSQL)
  const handleSubmit = async () => {
    setIsSending(true);
    
    const payload = {
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      rating: rating,
      feedback_areas: selectedCats, // Array for PostgreSQL TEXT[]
      comments: userData.comments
    };

    try {
      const response = await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log("🚀 Data sent to backend successfully!");
        setPage(4); // THIS LINE MOVES YOU TO THE SUCCESS SCREEN
      } else {
        const errorData = await response.json();
        console.error("❌ Backend error:", errorData.error);
        alert("Submission failed: " + errorData.error);
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      alert("Could not reach the server. Is node server.js running?");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '20px' }}>
      <motion.div layout style={{ background: 'white', width: '100%', maxWidth: '480px', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5)' }}>
        
        {/* Progress Tracker */}
        <div style={{ height: '6px', background: '#f1f5f9', width: '100%', display: 'flex' }}>
          {[1, 2, 3, 4].map(s => <div key={s} style={{ flex: 1, background: page >= s ? '#2563eb' : 'transparent', transition: '0.4s' }} />)}
        </div>

        <div style={{ padding: '40px' }}>
          <AnimatePresence mode="wait">
            
            {page === 1 && (
              <motion.div key="p1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <header style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <div style={{ background: '#eff6ff', padding: '6px 12px', borderRadius: '100px', display: 'inline-block', color: '#2563eb', fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>AIRPORT QUALITY CONTROL</div>
                  <h1 style={{ fontSize: '26px', marginTop: '15px', color: '#1e293b', fontWeight: '800' }}>How was your trip?</h1>
                </header>

                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <motion.div key={rating} animate={{ scale: [0.9, 1], color: theme.color }} style={{ fontSize: '70px', fontWeight: '900' }}>
                    {rating}<Star size={40} fill={theme.color} stroke="none" style={{ marginLeft: '8px' }} />
                  </motion.div>
                </div>

                <div style={{ position: 'relative', height: '120px', display: 'flex', alignItems: 'center', marginTop: '20px', padding: '0 10px' }}>
                  <div style={{ position: 'absolute', width: '100%', height: '40px', background: '#000000', borderRadius: '8px', left: 0 }} />
                  <div style={{ position: 'absolute', width: '100%', height: '2px', borderTop: '2px dashed #f2ff03', left: 0, opacity: 0.5 }} />
                  <input type="range" min="1" max="5" value={rating} onChange={(e) => setRating(parseInt(e.target.value))} style={{ position: 'absolute', width: '100%', height: '100px', opacity: 0, cursor: 'pointer', zIndex: 10, left: 0 }} />
                  <motion.div 
                    animate={{ left: `calc(${((rating - 1) / 4) * 100}% - 24px)`, y: planeMotion.y, rotate: planeMotion.rotate + 90 }}
                    transition={{ type: "spring", stiffness: 80, damping: 15 }}
                    style={{ position: 'absolute', color: theme.color, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}
                  >
                    <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ position: 'absolute', width: '60px', height: '60px', background: theme.color, borderRadius: '100%', filter: 'blur(15px)', zIndex: -1 }} />
                    <Plane size={54} fill={theme.color} />
                  </motion.div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', padding: '0 10px' }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <motion.button key={num} onClick={() => setRating(num)} whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
                      style={{
                        width: '44px', height: '44px', borderRadius: '50%', border: '2px solid',
                        borderColor: rating === num ? theme.color : '#e5e7eb',
                        background: rating === num ? theme.color : 'white',
                        color: rating === num ? 'white' : '#475569',
                        fontWeight: '900', fontSize: '16px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s'
                      }}>
                      {num}
                    </motion.button>
                  ))}
                </div>

                <button onClick={() => setPage(2)} style={{ width: '100%', padding: '20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '800', fontSize: '18px', marginTop: '40px', cursor: 'pointer' }}>Continue</button>
              </motion.div>
            )}

            {page === 2 && (
              <motion.div key="p2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <button onClick={() => setPage(1)} style={{ background: 'none', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '20px', fontWeight: '700' }}><ArrowLeft size={18}/> Back</button>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '30px' }}>What can we improve?</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {categories.map((cat) => (
                    <motion.button key={cat.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedCats(prev => prev.includes(cat.id) ? prev.filter(i => i !== cat.id) : [...prev, cat.id])}
                      style={{ 
                        padding: '24px', borderRadius: '24px', border: '2px solid', 
                        borderColor: selectedCats.includes(cat.id) ? '#2563eb' : '#f1f5f9', 
                        background: selectedCats.includes(cat.id) ? '#eff6ff' : 'white', 
                        cursor: 'pointer', textAlign: 'left'
                      }}>
                      <div style={{ color: selectedCats.includes(cat.id) ? '#2563eb' : '#64748b', marginBottom: '12px' }}>{cat.icon}</div>
                      <div style={{ fontWeight: '700', fontSize: '14px', lineHeight: '1.2' }}>{cat.id}</div>
                    </motion.button>
                  ))}
                </div>
                <button onClick={() => setPage(3)} style={{ width: '100%', padding: '22px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '800', fontSize: '18px', marginTop: '30px', cursor: 'pointer' }}>Next Step</button>
              </motion.div>
            )}

             {page === 3 && (
              <motion.div key="p3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <button onClick={() => setPage(2)} style={{ background: 'none', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '20px', fontWeight: '700' }}><ArrowLeft size={18}/> Back</button>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', marginBottom: '25px' }}>Additional Details...</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    { name: 'name', icon: User, label: 'Full Name', val: userData.name, valid: isNameValid },
                    { name: 'phone', icon: Phone, label: 'Phone Number', val: userData.phone, valid: isPhoneValid },
                    { name: 'email', icon: Mail, label: 'Email Address', val: userData.email, valid: isEmailValid }
                  ].map((field) => (
                    <div key={field.name} style={{ position: 'relative' }}>
                      <field.icon size={20} style={{ position: 'absolute', left: '20px', top: '20px', color: field.val ? (field.valid ? '#10b981' : '#ef4444') : '#94a3b8' }} />
                      <input name={field.name} value={field.val} placeholder={field.label} onChange={handleInput} 
                        style={{ width: '100%', padding: '20px 20px 20px 55px', borderRadius: '18px', border: '2px solid #f1f5f9', fontSize: '16px', outline: 'none', background: '#f8fafc' }} />
                    </div>
                  ))}
                  <textarea name="comments" value={userData.comments} placeholder="Comments..." onChange={handleInput}
                    style={{width: '100%', padding: '20px', borderRadius: '18px', border: '2px solid #f1f5f9', fontSize: '16px', minHeight: '100px', outline: 'none', background: '#f8fafc' }} />
                </div>
                <button disabled={!isFormValid || isSending} onClick={handleSubmit}
                  style={{ width: '100%', padding: '22px', background: isFormValid ? '#2563eb' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '20px', fontWeight: '800', fontSize: '18px', marginTop: '30px', cursor: isFormValid ? 'pointer' : 'not-allowed' }}>
                  {isSending ? "Processing..." : "Finish & Submit"}
                </button>
              </motion.div>
            )}

            {page === 4 && (
              <motion.div key="p4" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle size={100} color="#10b981" style={{ margin: '0 auto 30px' }} />
                <h2 style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b' }}>Success!</h2>
                <p style={{ color: '#64748b', fontSize: '18px', marginTop: '12px' }}>Your feedback has been logged.<br/>Thank you for helping us improve.</p>
                <button onClick={() => window.location.reload()} style={{ marginTop: '50px', padding: '16px 32px', background: '#f1f5f9', border: 'none', borderRadius: '15px', fontWeight: '800', color: '#1e293b', cursor: 'pointer' }}>New Feedback</button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}