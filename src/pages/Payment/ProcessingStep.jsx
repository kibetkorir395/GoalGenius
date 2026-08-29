const ProcessingStep = ({ plan, phone }) => {
    return (
      <div className='processing-step'>
        <div className='processing-ring'>
          <div className='processing-spinner' />
        </div>
        <h3>Processing Payment</h3>
        <p>Please check your phone and enter your M-Pesa PIN to complete the transaction.</p>
        <div className='processing-details'>
          <span>Amount: KSH {plan?.price}</span>
          <span>Phone: {phone}</span>
        </div>
      </div>
    );
  };
  
  export default ProcessingStep;