import './Testimonials.scss'
import { testimonials } from '../../data'

export default function Testimonials() {
    return (
    <div className='testimonials-section'>
      <h2 className="section-title">What Our Users Say</h2>
      <p className="section-subtitle">Join thousands of satisfied subscribers winning with GoalGenius</p>
      <div className="testimonials-grid">
        {testimonials.map((testimonial, idx) => (
          <div className="testimonial-card" key={testimonial.id} style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className="testimonial-quote">"</div>
            <p className="testimonial-text">{testimonial.description}</p>
            <div className="testimonial-author">
              <div className="author-avatar">
                {testimonial.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="author-info">
                <span className="author-name">{testimonial.name}</span>
                <span className="author-plan">{testimonial.title}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    )
}
