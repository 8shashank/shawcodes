import { Link, Outlet } from "react-router-dom";
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Shaw's Toolbox</h1> 
      <div className="sidenav">
        <Link to="/uscis">USCIS Case Decoder</Link> 
      </div>
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
