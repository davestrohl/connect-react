import React from 'react';
import ReactDOM from 'react-dom';
import Conn4 from './conn4';
import './index.css';

ReactDOM.render(
  <Conn4 rows={6} columns={7} winCondition={4} />,
  document.getElementById('root')
);
