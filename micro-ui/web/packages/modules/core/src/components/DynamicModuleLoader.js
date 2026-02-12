import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Loader } from "@egovernments/digit-ui-components";
import { useTranslation } from "react-i18next";

/**
 * DynamicModuleLoader handles loading of modules from the ComponentRegistryService
 * with loading states, retries, and graceful error handling
 */
const DynamicModuleLoader = ({ 
  moduleCode, 
  stateCode, 
  userType, 
  tenants, 
  maxRetries = 5, 
  retryDelay = 1500,
  initialDelay = 800 // Initial delay before first check to allow modules to register
}) => {
  const [moduleState, setModuleState] = useState({
    module: null,
    loading: true,
    error: null,
    retryCount: 0,
    initialDelayComplete: false
  });
  const { t } = useTranslation();

  useEffect(() => {
    let retryTimeout;
    let initialTimeout;

    const loadModule = async () => {
      try {
        // Check if module is available in ComponentRegistryService
        const Module = Digit.ComponentRegistryService.getComponent(`${moduleCode}Module`);
        
        if (Module) {
          setModuleState({
            module: Module,
            loading: false,
            error: null,
            retryCount: 0,
            initialDelayComplete: true
          });
        } else {
          // Module not found, check if we should retry
          setModuleState(prev => {
            const newRetryCount = prev.retryCount + 1;
            if (newRetryCount < maxRetries) {
              // Retry after delay (exponential backoff)
              const delay = retryDelay * Math.pow(1.5, prev.retryCount);
              retryTimeout = setTimeout(() => {
                loadModule();
              }, delay);
              
              return {
                ...prev,
                retryCount: newRetryCount
              };
            } else {
              // Max retries reached
              return {
                module: null,
                loading: false,
                error: `Module "${moduleCode}" not found after ${maxRetries} attempts`,
                retryCount: newRetryCount,
                initialDelayComplete: true
              };
            }
          });
        }
      } catch (error) {
        console.error(`Error loading module ${moduleCode}:`, error);
        setModuleState({
          module: null,
          loading: false,
          error: error.message,
          retryCount: moduleState.retryCount,
          initialDelayComplete: true
        });
      }
    };

    // Start with initial delay to allow modules to register
    if (!moduleState.initialDelayComplete) {
      initialTimeout = setTimeout(() => {
        setModuleState(prev => ({ ...prev, initialDelayComplete: true }));
        loadModule();
      }, initialDelay);
    } else {
      loadModule();
    }

    // Cleanup timeouts on unmount
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (initialTimeout) {
        clearTimeout(initialTimeout);
      }
    };
  }, [moduleCode, maxRetries, retryDelay, initialDelay]);

  // Show loading state
  if (moduleState.loading) {
    const loadingText = !moduleState.initialDelayComplete
      ? t("CORE_INITIALIZING_MODULE", { moduleCode, defaultValue: "Initializing {{moduleCode}} module..." })
      : t("CORE_LOADING_MODULE", { moduleCode, defaultValue: "Loading {{moduleCode}} module..." });

    return (
      <div className="module-loading-container">
        <Loader 
          page={true} 
          variant="PageLoader" 
          loaderText={loadingText}
        />
        {moduleState.retryCount > 0 && moduleState.initialDelayComplete && (
          <div className="retry-info" style={{ textAlign: 'center', marginTop: '1rem', color: '#666' }}>
            {t("CORE_MODULE_RETRY_ATTEMPT", { retryCount: moduleState.retryCount, maxRetries, defaultValue: "Retry attempt {{retryCount}}/{{maxRetries}}" })}
          </div>
        )}
      </div>
    );
  }

  // Show error state and redirect
  if (moduleState.error || !moduleState.module) {
    console.warn(`Module loading failed for ${moduleCode}:`, moduleState.error);
    console.warn(`Available components:`, Object.keys(Digit.ComponentRegistryService.getAllComponents() || {}));
    return (
      <Navigate
        to={`/${window?.contextPath}/${userType || 'citizen'}/user/error?type=notfound&module=${moduleCode}&reason=${encodeURIComponent(moduleState.error || 'Module not found')}`}
        replace
      />
    );
  }

  // Render the loaded module
  const Module = moduleState.module;
  return (
    <Module 
      stateCode={stateCode} 
      moduleCode={moduleCode} 
      userType={userType} 
      tenants={tenants} 
    />
  );
};

export default DynamicModuleLoader;