import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <div className="rounded-3xl p-8 bg-card border border-white/10 shadow-soft">
        <div className="text-3xl font-black">404</div>
        <div className="mt-2 text-white/70">Страница не найдена.</div>
        <div className="mt-6">
          <Link to="/"><Button>На главную</Button></Link>
        </div>
      </div>
    </div>
  );
}
