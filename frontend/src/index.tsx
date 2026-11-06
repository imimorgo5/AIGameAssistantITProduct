import { createRoot } from "react-dom/client";

import App from "./_app/App";
import "./_app/styles/global.scss";
const container = document.getElementById("root");
if (!container) throw new Error("Корневой элемент приложения отсутствует");

const root = createRoot(container);
root.render(<App />);
