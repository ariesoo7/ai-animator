import {Annotation} from "@langchain/langgraph";

type TaskStatus =
    "storyboard_generated"
  | "coding_saved"
  | "offloaded"
  | "rendering"
  | "render_complete"
  | "render_failed"
  | ""
  ;
const manimState = Annotation.Root({

    userId:Annotation<string>({
    reducer:(currentState,updateValue)=> updateValue,

    default:()=>"",
    }),

    topic:Annotation<string>({
    reducer:(currentState,updateValue)=> updateValue,

    default:()=>"",
    }),

    storyBoard:Annotation<string>({
    reducer:(currentState,updateValue)=> updateValue,

    default:()=>"",
    }),

    approved:Annotation<boolean>({
    reducer:(currentState,updateValue)=> updateValue,

    default:()=>false,
    }),

    code:Annotation<string>({
    reducer:(currentState,updateValue)=> updateValue,

    default:()=>"",
    }),

    error:Annotation<string>({
    reducer:(currentState,updateValue)=> updateValue,

    default:()=>"",
    }),
    hasError: Annotation<boolean>({
      reducer:(currentState,updateValue)=> updateValue,

      default:()=>false
    }),
    video_url:Annotation<string>({
    reducer:(currentState,updateValue)=> updateValue,

    default:()=>"",
    }),

    // Path to the rendered video, written by waitForRenderResult when the
    // worker resumes the graph with a successful result.
    videoPath:Annotation<string>({
    reducer:(currentState,updateValue)=> updateValue,

    default:()=>"",
    }),

    // How many times the render has been retried by solveError -> offload.
    retryCount:Annotation<number>({
    reducer:(currentState,updateValue)=> updateValue,

    default:()=>0,
    }),

    status:Annotation<TaskStatus>({
    reducer:(currentState,updateValue)=> updateValue,

    default:()=>"",
    }),

});

export default manimState;