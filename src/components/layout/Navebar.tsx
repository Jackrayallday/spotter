import { Dumbbell } from "lucide-react";
import {Link} from "react-router-dom";
import { Button } from "../ui/Button";

export default function Navbar() {
  const user = false;
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md ">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-[var(--color-foreground)]">
          <Dumbbell className="h-6 w-6 text-[var(--color-accent)]"/>
          <span className="font-semibold text-lg">Spotter</span>
        </Link>

        <nav>
          {/* if the user is authenticated, give them UI to reflect that */}
          {user ? ( 
            <>
              <Link to="/profile">
                <Button variant="ghost" size="sm">My Plan</Button>
              </Link>
            </> )
          //if the user is authenticated, give them UI to reflect that

          :(
            <>
              <Link to="/auth/sign-in">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/auth/sign-up">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}