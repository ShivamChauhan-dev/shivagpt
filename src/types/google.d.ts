interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential?: string }) => void;
        }) => void;
        renderButton: (
          element: HTMLElement,
          config: {
            theme?: string;
            size?: string;
            type?: string;
            shape?: string;
            text?: string;
            width?: number;
          }
        ) => void;
        prompt: () => void;
      };
    };
  };
}
