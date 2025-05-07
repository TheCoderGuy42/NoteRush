"use client";
import { useRef, useEffect, useState } from "react";
import { Tooltip } from "react-tooltip"; // Import the Tooltip component

import TypingArea from "./typing-area";
import { useRecordStore, type GameStatus } from "@/context/store";
import { api } from "@/trpc/react";
import RecordList from "./record-list";
import AuthStatus from "./auth-status";
import useGameStateMachine from "./use-game-state-machine";
import toast, { Toaster } from "react-hot-toast";
import PdfDrawer from "./sidebar/drawer";
import { useSession, authClient } from "@/server/auth/react-client";

const data = {
  // Keep your data object as is
  paragraphsnow: [
    // ... your paragraphsnow array ...
    "snowflake enables every organization to mobilize their data with snowflakes data cloud customers use the data cloud to unite siloed data discover and securely share data power data applications and execute diverse aiml and analytic workloads",
    "wherever data or users live snowflake delivers a single data experience that spans multiple clouds and geographies thousands of customers across many industries including 647 of the 2023 forbes global 2000 g2k use snowflake data cloud to power their businesses",
    "these applications are not only transforming the way we interact with technology but also reshaping various sectors of society theyre harnessing the power of vast amounts of data and leveraging advanced artificial intelligence ai algorithms",
    "in healthcare modern applications are being used to predict disease outbreaks improve patient care and accelerate drug discovery in education applications provide personalized learning experiences and early identification of students who need more help",
    "the snowflake data cloud is the best choice for application architecture because it simplifies development and operations by providing a unified secure and fully governed cloud environment for data storage integration analysis and other computing tasks",
    "snowpark was designed to make building data pipelines and aiml models in snowflake a breeze using programming languages such as python java and scala without any data movement",
    "modern apps are data intensive and ai enriched they process large volumes of complex and fast changing data from different sources analyze it with aimachine learning ml models",
    "in other words modern apps handle data collection processing and representation to provide value in the form of ai enriched insights here are some examples",
    "the chief advantage of three tier application architecture is that developers can develop modify and scale the tiers separately instead of changing the entire application",
    "at the bottom is the data tier sometimes called the database tier or persistence layer this is where the data that feeds the processing tier is stored and managed it includes the data storage and access mechanisms",
    "in the middle is the processing tier also known as the business logic or compute layer this is where business logic for the application is defined for example through a specific set of business rules",
    "this tier processes information thats collected in the presentation tier as well as information stored in the data tier through data transformations and ml models the processing tier can also add change or delete data in the data tier",
    "on the top is the presentation tier which houses the user interface this is where the user interacts with the data its main purpose is to display information communicate and collect data from the end user",
    "a cloud data platform provides a unified secure and fully governed cloud environment for data store integration analysis and other computing tasks",
    "snowpark is the set of libraries and runtimes in snowflake that securely enable developers to deploy and process non sql code including python java and scala",
    "on the server side runtimes include either python java and scala in the warehouse model or snowpark container services snowflakes virtual warehouses are compute clusters that host and run server side contracts",
    "for python developers snowparks python runtime makes it possible to write custom python code through udfs and stored procedures which are deployed into snowflakes secure python sandbox",
    "udfs and stored procedures are two key components of snowpark that allow developers to bring custom python logic to snowflakes compute engine while taking advantage of open source packages preinstalled from anaconda in snowpark",
    "custom logic written in python runs directly in snowflake using udfs these functions can stand alone or be called as part of a dataframe operation to process the data",
    "snowpark takes care of serializing the custom code into python byte code and pushes all of the logic to snowflake so it runs next to the data",
    "snowpark stored procedures help developers operationalize their python code and run orchestrate and schedule their pipelines",
    "a stored procedure is created once and can be executed many times with a simple call statement in your orchestration or automation tools snowflake supports stored procedures in sql python java javascript and scala",
    "to leverage open source innovation snowpark has partnered with anaconda for a product integration without any additional cost to the user beyond warehouse usage",
    "developers in snowflake are now able to speed up their python based pipelines by taking advantage of the seamless dependency management and comprehensive set of curated open source packages provided by anaconda",
    "snowpark optimized warehouses have compute nodes with 16x the memory and 10x the local cache compared with standard warehouses the larger memory helps unlock memory intensive use cases on large data sets",
    "snowpark container services is a new snowpark runtime option that enables developers to effortlessly deploy manage and scale containerized workloads jobs services service functions using secure snowflake managed infrastructure with configurable hardware options such as gpus",
    "with containers running in snowflake there is no need to move governed data outside of snowflake to use it as part of the most sophisticated aiml models and apps",
    "the containers built and packaged by developers using their tools of choice can include code in any programming language for example cc node js python r react etc",
    "snowflake native apps provide the building blocks for app development distribution operation and monetization all within snowflakes platform",
    "snowpark allows users to easily process and derive insights from unstructured data from files such as images videos and audio python developers can easily take advantage of the python ecosystem of open source packages",
  ],
  database: [
    // ... your database array ...
    "paxos is a family of protocols ensuring distributed agreement despite node failures it guarantees safety by requiring a majority quorum for proposals and commits making it robust but complex",
    "raft simplifies distributed consensus compared to paxos it uses leader election and replicated logs ensuring that all nodes agree on the sequence of operations in a fault tolerant manner",
    "bft mechanisms allow distributed systems to reach consensus even when some nodes exhibit arbitrary malicious behavior byzantine faults unlike protocols assuming only crash failures",
    "2pc coordinates atomic transactions across multiple distributed nodes it involves a prepare phase where nodes vote and a commitabort phase based on the vote outcome blocking is a risk",
    "3pc aims to reduce 2pcs blocking issue during coordinator or node failures it adds a pre commit phase allowing non blocking recovery under certain failure scenarios",
    "vector clocks track causality in distributed systems by assigning a vector timestamp to each event comparing vectors reveals if events are causally related concurrent or ordered",
    "matrix clocks extend vector clocks enabling nodes to maintain knowledge about other nodes knowledge of event times this helps track more complex causal relationships and global states",
    "lamport timestamps assign a logical clock value a simple counter to events establishing a total ordering consistent with causality concurrent events might get arbitrary order",
    "hlcs combine physical clock time with logical counters they provide timestamps that reflect causality like lamport clocks but stay close to physical time for better observability",
    "version vectors are used in replicated systems to track the history of updates for each replica they help detect and reconcile conflicting updates made concurrently",
    "crdts are data structures designed for replication where concurrent updates can merge automatically without conflicts ensuring strong eventual consistency without complex coordination",
    "state based crdts or cvrdts achieve strong eventual consistency by shipping the entire state merging involves a commutative associative idempotent join function ensuring convergence",
    "ot algorithms manage concurrent edits on shared documents common in collaborative editors they transform operations based on previously applied concurrent operations to ensure consistency",
    "gossip or epidemic protocols spread information through a network probabilistically nodes randomly exchange updates with peers ensuring eventual dissemination across the system efficiently",
    "anti entropy protocols periodically compare and reconcile replicas states in a distributed system they actively push or pull data to ensure convergence towards consistency",
    "consistent hashing minimizes key remapping when nodes are added or removed in a distributed hash table keys are assigned to the nearest clockwise node on a virtual ring",
    "rendezvous hashing highest random weight hashing allows clients to agree on server assignment for an object using a hashing function without central coordination or complex remapping",
    "chord is a peer to peer protocol implementing a distributed hash table it uses consistent hashing and finger tables for efficient o log n key lookups in a dynamic network",
    "distributed hash tables provide scalable key value storage they partition data across nodes using hashing offering decentralized lookup typically with logarithmic time complexity",
    "skip lists are probabilistic data structures providing efficient search like balanced trees skip graphs extend this concept for decentralized fault tolerant peer to peer network overlays",
    "pacelc extends cap in case of network partition systems trade availability vs consistency else normal operation they trade latency vs consistency it highlights inherent design tradeoffs",
    "harvest measures the fraction of data retrieved from an available system partition while yield measures the probability of completing a request they quantify degraded performance under failures",
    "base basically available soft state eventually consistent contrasts with acid it prioritizes availability over immediate consistency common in highly scalable web systems",
    "quorum systems ensure consistency by requiring read r and write w operations to overlap on n replicas r + w > n this allows tuning consistency levels",
    "pbs provides guarantees on data staleness within certain probabilistic bounds clients can estimate the maximum age of the data they might read from replicas",
    "shannon entropy quantifies the average information content or uncertainty of a data source it provides a theoretical lower bound for lossless data compression algorithms",
    "kolmogorov complexity measures the algorithmic complexity of an object as the length of the shortest program generating it it defines the ultimate limit of data compression",
    "huffman coding is a lossless compression algorithm creating variable length prefix codes more frequent symbols get shorter codes minimizing the average code length based on statistics",
    "lempel ziv algorithms like lz77 used in gzip and lzma in 7zip are dictionary based compressors they achieve compression by replacing repeated data sequences with references",
    "bloom filters probabilistically check set membership with potential false positives count min sketches estimate item frequencies in data streams both using compact space",
    "algorithms like prims or kruskals find a minimum spanning tree mst in a weighted grapha subset of edges connecting all vertices with minimum total edge weight",
    "in a directed graph strongly connected components sccs are maximal subgraphs where every vertex is reachable from every other vertex within that subgraph useful for dependency analysis",
    "betweenness centrality measures a nodes importance in a graph based on how often it lies on the shortest paths between other pairs of nodes high centrality indicates influence",
    "these algorithms divide a graphs vertices into balanced subsets while minimizing edge cuts between subsets used in parallel processing and distributed databases for load balancing",
    "pregel is a vertex centric model for large scale graph processing inspired by google computations occur in synchronous supersteps with vertices exchanging messages along edges",
    "semi joins reduce data transfer in distributed joins by sending only necessary joining column values bloom joins use bloom filters to filter rows unlikely to match",
    "sip enhances distributed query optimization by passing intermediate result properties like size or distinct values sideways between parallel plan branches to refine estimates",
    "data skew where some values are disproportionately frequent can bottleneck parallel query processing techniques involve repartitioning broadcasting small relations or specialized join algorithms",
    "dcbo extends traditional query optimization for distributed environments it considers network transfer costs data distribution and local processing costs to find efficient execution plans",
    "adaptive query processing techniques adjust query execution plans mid flight based on actual runtime statistics correcting initial misestimations and improving performance for complex queries",
    "mvcc allows readers to access older data versions while writers create new ones this avoids read write conflicts enabling high concurrency often providing snapshot isolation",
    "occ assumes conflicts are rare transactions execute on private copies then validate before committing if conflicts are detected via readwrite set checks transactions abort and retry",
    "these protocols ensure serializability by assigning timestamps to transactions conflicting operations are ordered based on these timestamps potentially causing aborts if order is violated",
    "predicate locking prevents phantom reads by locking data ranges based on logical predicates eg age > 30 rather than specific items ensuring serializability under complex conditions",
    "sgt detects concurrency conflicts by building a serialization graph where nodes are transactions and edges represent dependencies cycles in the graph indicate non serializable executions",
    "lsm trees optimize write performance by buffering writes in memory and merging them sequentially to disk reads may involve checking multiple sorted runs or levels",
    "wal ensures durability by writing changes to a sequential log file before applying them to the actual data pages this allows recovery after crashes by replaying the log",
    "checkpoints periodically save a consistent database state to disk reducing recovery time after a crash fuzzy checkpoints allow operations during the checkpoint process",
    "aries is a recovery algorithm standard known for its correctness and efficiency it uses wal repeating history during redo and undoing incomplete transactions during undo phases",
    "this approach recovers lost data or computation by tracking data dependencies lineage and recomputing only the necessary parts often used in big data systems like spark",
    "b+ trees are standard disk based index structures variants like prefix b trees or b* trees offer optimizations for specific workloads like string keys or higher node utilization",
    "r trees are spatial index structures using bounding boxes to index multi dimensional data r* trees are an optimized variant improving query performance through sophisticated node splitting",
    "concurrent skip lists provide efficient scalable search insertion and deletion in parallel environments they often use lock free techniques offering an alternative to balanced trees",
    "fractal trees or b trees are cache oblivious index structures aiming for better asymptotic io performance than b trees by buffering updates and applying them in batches",
    "prefix b trees optimize b+ trees for string keys by storing only discriminating prefixes in internal nodes reducing tree size and improving cache performance for string lookups",
    "phi accrual failure detectors output suspicion levels about node failures based on heartbeat arrival times adapting dynamically to network conditions unlike fixed timeout detectors",
    "swim is a gossip based protocol providing scalable robust group membership tracking it uses randomized probing and suspicion propagation for efficient failure detection",
    "virtual synchrony is a group communication model providing strong guarantees about message delivery order relative to membership changes simplifying fault tolerant application development",
    "in leaderless replication eg dynamo style any replica can accept writes consistency relies on mechanisms like read repair hinted handoff and quorum protocols",
    "atomic broadcast ensures messages are delivered reliably to all correct processes in the same total order even with failures crucial for state machine replication",
    "tla+ is a formal specification language used for designing modeling and verifying concurrent and distributed systems it helps catch high level design flaws early",
    "coq is an interactive theorem prover it allows expressing mathematical assertions and program properties and mechanically checking formal proofs of correctness ensuring high assurance",
    "linearizability is a strong consistency model operations appear to execute instantaneously and atomically at some point between their invocation and completion respecting real time order",
    "model checking automatically verifies if a system model satisfies a given formal specification often using temporal logic it explores the state space to find counterexamples",
    "bisimulation is a behavioral equivalence relation between state transition systems two systems are bisimilar if they can mimic each others transitions step by step",
    "inverted indices map terms to the documents containing them often storing positions posting lists this structure enables efficient full text search engines by quickly finding relevant documents",
    "lsi uses dimensionality reduction techniques like svd on term document matrices it aims to uncover latent semantic relationships improving retrieval by matching concepts not just keywords",
    "tf idf term frequency inverse document frequency measures word importance in a document relative to a corpus high scores indicate terms frequent locally but rare globally",
    "lsh hashes items such that similar items map to the same buckets with high probability it enables approximate nearest neighbor search efficiently in high dimensional spaces",
    "minhash efficiently estimates the jaccard similarity between sets eg document shingles it uses minimum hash values from random permutations to create compact set signatures",
    "homomorphic encryption allows computations like addition or multiplication to be performed directly on encrypted data without decrypting it first preserving privacy during processing",
    "zero knowledge proofs allow one party prover to convince another verifier that a statement is true without revealing any information beyond the statements truth itself",
    "threshold cryptography distributes cryptographic keys and operations like signing or decryption among multiple parties a threshold number of parties must cooperate to perform the operation",
    "differential privacy provides strong mathematically provable guarantees that query results on a dataset do not reveal sensitive information about any single individual within that dataset",
    "secure multi party computation smpc enables multiple parties to jointly compute a function over their private inputs without revealing those inputs to each other",
    "drf is a resource allocation algorithm for multi resource clusters cpu ram it aims for fairness by equalizing the dominant resource share allocated to each user",
    "bin packing algorithms try to fit items of various sizes into a minimum number of fixed capacity bins approximation algorithms find near optimal solutions efficiently for this np hard problem",
    "johnsons algorithm finds an optimal schedule minimizing the makespan total time for processing n jobs on two machines assuming each job has a fixed processing time on each",
    "work stealing deques double ended queues are used in parallel task scheduling idle processors steal tasks from the deques of busy processors to achieve load balancing",
    "these algorithms handle allocation problems where resources have multiple dimensions eg cpu memory bandwidth they often involve complex optimization techniques to satisfy diverse constraints",
  ],
};

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const session = useSession();
  const utils = api.useUtils();

  // 1. Fetch PDF limit status
  const {
    data: isAboveLimit,
    isLoading: isLoadingLimit,
    error: limitError,
  } = api.limits.isAbovePdfLimit.useQuery(undefined, {
    enabled: !!session.data,
    refetchOnWindowFocus: true,
  });

  const { data: hasActiveSubscription } =
    api.limits.hasActiveSubscription.useQuery(undefined, {
      enabled: !!session.data,
      refetchOnWindowFocus: true,
    });

  // 2. Define when the upload button should be truly disabled
  const uploadShouldBeDisabled =
    !session.data || // No session, no uploads
    isLoadingLimit || // Still checking the limit
    isAboveLimit === true || // Explicitly above limit (true means limit is hit)
    !!limitError; // An error occurred fetching limit, safer to disable

  const uploadButtonTooltipContent =
    "Free users can upload up to 5 PDFs. Upgrade to Pro for up to 50 PDFs!";

  // 3. PDF Upload Mutation
  const { mutate: addPdf, isPending: isPdfLoading } =
    api.pdfProcessor.add.useMutation({
      onMutate: (variables) => {
        toast.loading(`Uploading PDF: ${variables.filename}...`, {
          id: "pdf-upload",
        });
      },
      onSuccess: (data) => {
        console.log("Successfully added PDF:", data);
        toast.success("PDF uploaded successfully!");
        void utils.pdfProcessor.get.invalidate();
        void utils.limits.isAbovePdfLimit.invalidate(); // Refresh limit status
      },
      onError: (error) => {
        console.error("Error adding PDF:", error);
        toast.error(`Failed to upload PDF: ${error.message}`);
        void utils.limits.isAbovePdfLimit.invalidate(); // Refresh limit status
      },
      onSettled: () => {
        toast.dismiss("pdf-upload");
      },
    });

  const [input, setInput] = useState("");
  const [target, setTarget] = useState("");
  const [boilerplate, setBoilerplate] = useState(
    getRandomInt(data.database.length),
  );

  const [selectedPdf, setSelectedPdf] = useState<number | null>(null);
  const pdfsQuery = api.pdfProcessor.get.useQuery(undefined, {
    enabled: !!session.data,
  });

  const selectPdf = (pdfId: number) => {
    setSelectedPdf(pdfId);
    resetGame();
    if (pdfsQuery.data) {
      console.log(pdfsQuery.data.find((pdf) => pdf.id === pdfId));
    }
  };

  useEffect(() => {
    if (!pdfsQuery.data || !selectedPdf) return; // Added check for selectedPdf
    const pdf = pdfsQuery.data.find((pdf) => pdf.id === selectedPdf);
    if (!pdf || !pdf.paragraphs || pdf.paragraphs.length === 0) return; // Added check for paragraphs
    const rand_para_id = getRandomInt(pdf.paragraphs.length);
    const rand_para = pdf.paragraphs[rand_para_id];
    if (!rand_para) return;
    setTarget(rand_para.text);
  }, [pdfsQuery.data, selectedPdf]);

  const gameState = useRecordStore((state) => state.status);
  const setGameState = useRecordStore((state) => state.setStatus);
  useGameStateMachine(input, target);

  const boilerPlate = data.database[boilerplate];

  const resetGame = () => {
    setGameState("idle");
    setInput("");
    setTarget("");
    inputRef.current?.focus();
    if (!selectedPdf) {
      setBoilerplate(() => getRandomInt(data.database.length));
    } else {
      if (!pdfsQuery.data) return;
      const pdf = pdfsQuery.data.find((pdf) => pdf.id === selectedPdf);
      if (!pdf || !pdf.paragraphs || pdf.paragraphs.length === 0) return; // Added check
      const rand_para_id = getRandomInt(pdf.paragraphs.length);
      const rand_para = pdf.paragraphs[rand_para_id];
      if (!rand_para) return;
      setTarget(rand_para.text);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!(gameState == "stopped")) {
      setInput(e.target.value);
    }
  };

  const triggerFileUpload = () => {
    if (uploadShouldBeDisabled || isPdfLoading) {
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uploadShouldBeDisabled) {
      console.warn("handleFileChange: Upload attempt while disabled.");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    if (!e.target.files || e.target.files.length === 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }
    const file = e.target.files[0];
    if (!file) return;
    const filename = file.name;

    if (!file.type || file.type !== "application/pdf") {
      toast.error("Needs to be a PDF");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev: ProgressEvent<FileReader>) => {
      const uri = ev.target?.result as string;
      if (!uri.startsWith("data:application/pdf;base64,")) {
        toast.error("Needs to be a PDF (internal error should not get here)");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      const base64Data = uri.slice("data:application/pdf;base64,".length);

      addPdf({
        filename: filename,
        pdfBase64: base64Data,
      });
    };
    reader.onerror = () => {
      console.error("FileReader error:", reader.error);
      toast.error("Failed to read the file.");
      toast.dismiss("pdf-upload"); // Dismiss loading toast if FileReader fails
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!boilerPlate && !selectedPdf) {
      // Only set boilerplate if no PDF is selected
      setTarget("Select a PDF or one will be chosen for you.");
      return;
    }
    if (!selectedPdf && boilerPlate) {
      // If no PDF selected, use boilerplate
      setTarget(boilerPlate);
    }
  }, [boilerPlate, selectedPdf, setTarget]); // Added selectedPdf to dependencies

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const focus = () => {
    inputRef.current?.focus();
  };

  const isActive = (s: GameStatus) => {
    return s === "running" || s === "idle";
  };

  const handleSubscribeClick = async () => {
    try {
      toast.loading("Preparing subscription...", { id: "subscription" });
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}`; // success is still the same url
      const cancelUrl = `${baseUrl}`;

      const result = await authClient.subscription.upgrade({
        plan: "pro",
        successUrl,
        cancelUrl,
      });

      if (result.error) {
        console.error("Subscription failed:", result.error);
        toast.error(
          `Subscription failed: ${result.error.message ?? "Unknown error"}`,
          { id: "subscription" },
        );
        return;
      }
      toast.success("Redirecting to payment...", { id: "subscription" });
    } catch (err) {
      console.error("Subscription error:", err);
      toast.error(
        `Subscription error: ${err instanceof Error ? err.message : "Unknown error"}`,
        { id: "subscription" },
      );
    }
  };

  const handleCancelSubscription = async () => {
    try {
      toast.loading("Cancelling subscription...", { id: "subscription" });
      const baseUrl = window.location.origin;
      const result = await authClient.subscription.cancel({
        returnUrl: baseUrl,
      });

      if (result.error) {
        console.error("Cancellation failed:", result.error);
        toast.error(
          `Cancellation failed: ${result.error.message ?? "Unknown error"}`,
          { id: "subscription" },
        );
        return;
      }
      toast.success("Subscription cancelled successfully!");
      void utils.limits.hasActiveSubscription.invalidate();
      void utils.limits.isAbovePdfLimit.invalidate();
    } catch (err) {
      console.error("Cancellation error:", err);
      toast.error(
        `Cancellation error: ${err instanceof Error ? err.message : "Unknown error"}`,
        { id: "subscription" },
      );
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="m-4 flex items-center space-x-4">
        <AuthStatus />
        {session.data && (
          <>
            {uploadShouldBeDisabled ? (
              <>
                <button
                  data-tooltip-id="upload-limit-tooltip"
                  data-tooltip-content={uploadButtonTooltipContent}
                  className={
                    "text-s cursor-not-allowed font-mono text-gray-500 transition-colors"
                  }
                  aria-disabled="true"
                >
                  upload pdf
                </button>
                {/* You can style the Tooltip component directly or use CSS classes */}
                <Tooltip
                  id="upload-limit-tooltip"
                  place="bottom"
                  style={{
                    backgroundColor: "rgb(55 65 81)", // Tailwind gray-700
                    color: "white",
                    maxWidth: "250px",
                    fontSize: "0.875rem", // text-sm
                    padding: "0.5rem", // p-2
                    borderRadius: "0.375rem", // rounded-md
                    textAlign: "center",
                    zIndex: 50, // Ensure tooltip is on top
                  }}
                />
              </>
            ) : (
              <button
                className={`text-s font-mono text-gray-300 transition-colors hover:text-gray-500 ${
                  isPdfLoading ? "cursor-wait opacity-70" : ""
                }`}
                onClick={triggerFileUpload}
                disabled={isPdfLoading || isLoadingLimit} // Also disable if limit is still loading
              >
                {isPdfLoading ? "uploading..." : "upload pdf"}
              </button>
            )}

            <PdfDrawer selectPdf={selectPdf} />

            {hasActiveSubscription ? (
              <button
                className="text-s font-mono text-gray-300 transition-colors hover:text-gray-500"
                onClick={() => void handleCancelSubscription()}
              >
                cancel subscription
              </button>
            ) : (
              <button
                className="text-s font-mono text-gray-300 transition-colors hover:text-gray-500"
                onClick={() => void handleSubscribeClick()}
              >
                go pro
              </button>
            )}
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          className="absolute -left-full h-0 w-0 opacity-0" // Effectively hide for focus only
          type="text"
          value={input}
          ref={inputRef}
          onChange={handleInput}
          aria-hidden="true"
        />
      </div>

      {target && (
        <div className={isActive(gameState) ? "" : "hidden"} onClick={focus}>
          <TypingArea target={target} input={input} />
        </div>
      )}

      {gameState === "stopped" && (
        <>
          <RecordList resetGame={resetGame} />
        </>
      )}
    </>
  );
}

export default App;
