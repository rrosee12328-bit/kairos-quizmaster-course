import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const VERSION_CHECK_INTERVAL = 60000; // Check every 60 seconds

interface VersionInfo {
  version: string;
  timestamp: string;
}

export const useVersionCheck = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const initialVersionRef = useRef<string | null>(null);
  const hasNotifiedRef = useRef(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Add cache-busting query param to avoid cached responses
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
        });
        
        if (!response.ok) return;
        
        const data: VersionInfo = await response.json();
        
        // Store initial version on first load
        if (initialVersionRef.current === null) {
          initialVersionRef.current = data.version;
          console.log('[VersionCheck] Initial version:', data.version);
          return;
        }
        
        // Check if version has changed
        if (data.version !== initialVersionRef.current && !hasNotifiedRef.current) {
          console.log('[VersionCheck] New version detected:', data.version);
          setUpdateAvailable(true);
          hasNotifiedRef.current = true;
          
          toast.info('A new version is available!', {
            description: 'Click to refresh and get the latest updates.',
            duration: Infinity,
            action: {
              label: 'Refresh Now',
              onClick: () => {
                window.location.reload();
              },
            },
            onDismiss: () => {
              // Reset notification flag after some time so user can be reminded again
              setTimeout(() => {
                hasNotifiedRef.current = false;
              }, 300000); // 5 minutes
            },
          });
        }
      } catch (error) {
        console.error('[VersionCheck] Error checking version:', error);
      }
    };

    // Initial check
    checkVersion();

    // Set up interval for periodic checks
    const intervalId = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  return { updateAvailable };
};
