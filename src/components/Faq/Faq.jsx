import { useState } from 'react';
import './Faq.scss';
import { faqs } from '../../data';
import { FiChevronDown } from 'react-icons/fi';

export default function Faq() {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleAccordion = (id) => {
    setActiveFaq((prev) => (prev === id ? null : id));
  };

  return (
    <div className="faq-section" id='faq'>
      <h2 className="section-title">Frequently Asked Questions</h2>
      <p className="section-subtitle">Got questions? We have answers.</p>
      <div className="faq-list">
        {faqs.map((faq) => (
          <div
            className={`faq-item ${activeFaq === faq.id ? 'active' : ''}`}
            key={faq.id}
            onClick={() => toggleAccordion(faq.id)}
          >
            <button className="faq-question" onClick={(e) => { e.stopPropagation(); toggleAccordion(faq.id); }}>
              <span>{faq.question}</span>
              <FiChevronDown className="faq-chevron" />
            </button>
            <div className={`faq-answer ${activeFaq === faq.id ? 'open' : ''}`}>
              <p>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
