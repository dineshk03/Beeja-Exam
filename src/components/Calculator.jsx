import React, { useState } from 'react';
import { X, Delete, Calculator as CalcIcon } from 'lucide-react';

function Calculator({ onClose }) {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operation, setOperation] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit) => {
    if (waitingForOperand) {
      setDisplay(String(digit));
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? String(digit) : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue, secondValue, operation) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      case '%':
        return firstValue % secondValue;
      default:
        return secondValue;
    }
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const Button = ({ children, onClick, className = '', span = false }) => (
    <button
      onClick={onClick}
      className={`
        p-4 rounded-lg font-semibold text-lg transition-all
        hover:scale-105 active:scale-95
        ${span ? 'col-span-2' : ''}
        ${className}
      `}
    >
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalcIcon className="w-5 h-5" />
            <h3 className="font-bold text-lg">Calculator</h3>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white hover:bg-opacity-20 p-1 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Display */}
        <div className="bg-gray-900 text-white p-6">
          <div className="text-right">
            {operation && (
              <div className="text-sm text-gray-400 mb-1">
                {previousValue} {operation}
              </div>
            )}
            <div className="text-4xl font-bold truncate">{display}</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 grid grid-cols-4 gap-2 bg-gray-50">
          {/* Row 1 */}
          <Button onClick={clear} className="bg-red-500 text-white hover:bg-red-600">
            AC
          </Button>
          <Button onClick={handleBackspace} className="bg-gray-300 hover:bg-gray-400">
            <Delete className="w-5 h-5 mx-auto" />
          </Button>
          <Button onClick={() => performOperation('%')} className="bg-blue-500 text-white hover:bg-blue-600">
            %
          </Button>
          <Button onClick={() => performOperation('÷')} className="bg-blue-500 text-white hover:bg-blue-600">
            ÷
          </Button>

          {/* Row 2 */}
          <Button onClick={() => inputDigit(7)} className="bg-white hover:bg-gray-100 border-2 border-gray-200">
            7
          </Button>
          <Button onClick={() => inputDigit(8)} className="bg-white hover:bg-gray-100 border-2 border-gray-200">
            8
          </Button>
          <Button onClick={() => inputDigit(9)} className="bg-white hover:bg-gray-100 border-2 border-gray-200">
            9
          </Button>
          <Button onClick={() => performOperation('×')} className="bg-blue-500 text-white hover:bg-blue-600">
            ×
          </Button>

          {/* Row 3 */}
          <Button onClick={() => inputDigit(4)} className="bg-white hover:bg-gray-100 border-2 border-gray-200">
            4
          </Button>
          <Button onClick={() => inputDigit(5)} className="bg-white hover:bg-gray-100 border-2 border-gray-200">
            5
          </Button>
          <Button onClick={() => inputDigit(6)} className="bg-white hover:bg-gray-100 border-2 border-gray-200">
            6
          </Button>
          <Button onClick={() => performOperation('-')} className="bg-blue-500 text-white hover:bg-blue-600">
            −
          </Button>

          {/* Row 4 */}
          <Button onClick={() => inputDigit(1)} className="bg-white hover:bg-gray-100 border-2 border-gray-200">
            1
          </Button>
          <Button onClick={() => inputDigit(2)} className="bg-white hover:bg-gray-100 border-2 border-gray-200">
            2
          </Button>
          <Button onClick={() => inputDigit(3)} className="bg-white hover:bg-gray-100 border-2 border-gray-200">
            3
          </Button>
          <Button onClick={() => performOperation('+')} className="bg-blue-500 text-white hover:bg-blue-600">
            +
          </Button>

          {/* Row 5 */}
          <Button onClick={() => inputDigit(0)} span className="bg-white hover:bg-gray-100 border-2 border-gray-200">
            0
          </Button>
          <Button onClick={inputDecimal} className="bg-white hover:bg-gray-100 border-2 border-gray-200">
            .
          </Button>
          <Button onClick={handleEquals} className="bg-green-500 text-white hover:bg-green-600">
            =
          </Button>
        </div>

        {/* Footer Info */}
        <div className="bg-gray-100 px-4 py-2 text-xs text-gray-600 text-center border-t">
          Drag this window to move. Press ESC to close.
        </div>
      </div>
    </div>
  );
}

export default Calculator;
