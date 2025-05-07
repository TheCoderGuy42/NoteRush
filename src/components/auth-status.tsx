import { useSession } from "@/server/auth/react-client";
import { useRouter } from "next/navigation";
import { signOut } from "@/server/auth/react-client";

export default function AuthStatus() {
  const router = useRouter(); // used by the auth only, let's think about how to host different users pdfs
  function goToSignIn() {
    router.push("/signin");
  }
  const session = useSession();

  return (
    <>
      {!session.data && (
        <>
          <button
            className="text-s mr-5 cursor-pointer font-mono text-gray-300 transition-colors hover:text-gray-500"
            onClick={() => {
              goToSignIn();
            }}
          >
            sign in
          </button>
        </>
      )}
      {session.data && (
        <>
          <button
            className="text-s mr-5 cursor-pointer font-mono text-gray-300 transition-colors hover:text-gray-500"
            onClick={() => {
              void signOut();
            }}
          >
            sign out
          </button>
        </>
      )}
    </>
  );
}
