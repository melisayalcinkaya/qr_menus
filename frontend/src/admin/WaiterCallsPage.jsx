import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import { useParams } from 'react-router-dom';
import API from '../API'; 
import '../styles/waiter-calls.css';

const WaiterCallsPage = () => {
  const { businessSlug } = useParams(); 
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCalls = async () => {
      setLoading(true);
      setError(null);

      try {
          const res = await API.get(`waiter-calls/`); 

          console.log('API response:', res.data);
          const data = res.data.results || []; 
          
          setCalls(data);

      } catch (err) {
          console.error(err);
          setError('Çağrılar yüklenirken hata oluştu. Oturumunuzu kontrol edin.'); 
          setCalls([]);
      } finally {
          setLoading(false);
      }
  };

  // WaiterCallsPage.jsx

  const completeCall = async (callId) => {
    try {
    
        await API.patch(`waiter-calls/${callId}/complete/`); 
         fetchCalls();
    } catch (err) {
       console.error(err);
       alert('İşlem başarısız');
    }
  };

  const cancelCall = async (callId) => {
      try {   
          await API.patch(`waiter-calls/${callId}/cancel/`); 
          fetchCalls();
      } catch (err) {
          console.error(err);
          alert('İşlem başarısız');
      }
  };

  useEffect(() => {
    console.log('businessSlug parametresi:', businessSlug);
    fetchCalls();
  }, [businessSlug]);

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="waiter-calls-container">
      <Sidebar />

      <div className="waiter-calls-main">
        <div className="page-header">
          <h1>Garson Çağrıları</h1>
          <p>Müşteri çağrılarını yönetin</p>
        </div>

        <div className="calls-list">
          {Array.isArray(calls) && calls.length > 0 ? (
            calls.map((call) => (
              <div key={call.id} className={`call-card ${call.status}`}>
                <div className="call-header">
                  <h3>Masa {call.table_number}</h3>
                  <span className={`status-badge ${call.status}`}>
                    {call.status === 'pending'
                      ? 'Beklemede'
                      : call.status === 'completed'
                      ? 'Tamamlandı'
                      : 'İptal Edildi'}
                  </span>
                </div>

                <div className="call-details">
                  {call.location && (
                    <p>
                      <strong>Lokasyon:</strong> {call.location}
                    </p>
                  )}
                  {call.notes && (
                    <p>
                      <strong>Not:</strong> {call.notes}
                    </p>
                  )}
                  <p>
                    <strong>İşletme:</strong> {call.business_name}
                  </p>
                  <p>
                    <strong>Çağrı Zamanı:</strong>{' '}
                    {new Date(call.called_at).toLocaleString('tr-TR')}
                  </p>
                </div>

                {call.status === 'pending' && (
                  <div className="call-actions">
                    <button
                      onClick={() => completeCall(call.id)}
                      className="btn-success"
                    >
                      Tamamlandı
                    </button>
                    <button
                      onClick={() => cancelCall(call.id)}
                      className="btn-danger"
                    >
                      İptal Et
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p>Henüz çağrı bulunmamaktadır</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaiterCallsPage;
