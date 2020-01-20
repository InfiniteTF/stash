import React, { useState, useEffect } from "react";
import { Button, Form, ProgressBar } from "react-bootstrap";
import { Link } from "react-router-dom";
import { StashService } from "src/core/StashService";
import { useToast } from "src/hooks";
import { Modal } from "src/components/Shared";
import { GenerateButton } from "./GenerateButton";

export const SettingsTasksPanel: React.FC = () => {
  const Toast = useToast();
  const [isImportAlertOpen, setIsImportAlertOpen] = useState<boolean>(false);
  const [isCleanAlertOpen, setIsCleanAlertOpen] = useState<boolean>(false);
  const [useFileMetadata, setUseFileMetadata] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const [progress, setProgress] = useState<number>(0);

  const [autoTagPerformers, setAutoTagPerformers] = useState<boolean>(true);
  const [autoTagStudios, setAutoTagStudios] = useState<boolean>(true);
  const [autoTagTags, setAutoTagTags] = useState<boolean>(true);

  const jobStatus = StashService.useJobStatus();
  const metadataUpdate = StashService.useMetadataUpdate();

  function statusToText(s: string) {
    switch (s) {
      case "Idle":
        return "Idle";
      case "Scan":
        return "Scanning for new content";
      case "Generate":
        return "Generating supporting files";
      case "Clean":
        return "Cleaning the database";
      case "Export":
        return "Exporting to JSON";
      case "Import":
        return "Importing from JSON";
      case "Auto Tag":
        return "Auto tagging scenes";
      default:
        return "Idle";
    }
  }

  useEffect(() => {
    if (jobStatus?.data?.jobStatus) {
      setStatus(statusToText(jobStatus.data.jobStatus.status));
      const newProgress = jobStatus.data.jobStatus.progress;
      if (newProgress < 0) {
        setProgress(0);
      } else {
        setProgress(newProgress);
      }
    }
  }, [jobStatus.data]);

  useEffect(() => {
    if (metadataUpdate?.data?.metadataUpdate) {
      setStatus(statusToText(metadataUpdate.data.metadataUpdate.status));
      const newProgress = metadataUpdate.data.metadataUpdate.progress;
      if (newProgress < 0) {
        setProgress(0);
      } else {
        setProgress(newProgress);
      }
    }
  }, [metadataUpdate.data]);

  function onImport() {
    setIsImportAlertOpen(false);
    StashService.queryMetadataImport().then(() => {
      jobStatus.refetch();
    });
  }

  function renderImportAlert() {
    return (
      <Modal
        show={isImportAlertOpen}
        icon="trash-alt"
        accept={{ text: "Import", variant: "danger", onClick: onImport }}
        cancel={{ onClick: () => setIsImportAlertOpen(false) }}
      >
        <p>
          Are you sure you want to import? This will delete the database and
          re-import from your exported metadata.
        </p>
      </Modal>
    );
  }

  function onClean() {
    setIsCleanAlertOpen(false);
    StashService.queryMetadataClean().then(() => {
      jobStatus.refetch();
    });
  }

  function renderCleanAlert() {
    return (
      <Modal
        show={isCleanAlertOpen}
        icon="trash-alt"
        accept={{ text: "Clean", variant: "danger", onClick: onClean }}
        cancel={{ onClick: () => setIsCleanAlertOpen(false) }}
      >
        <p>
          Are you sure you want to Clean? This will delete db information and
          generated content for all scenes that are no longer found in the
          filesystem.
        </p>
      </Modal>
    );
  }

  async function onScan() {
    try {
      await StashService.queryMetadataScan({ useFileMetadata });
      Toast.success({ content: "Started scan" });
      jobStatus.refetch();
    } catch (e) {
      Toast.error(e);
    }
  }

  function getAutoTagInput() {
    const wildcard = ["*"];
    return {
      performers: autoTagPerformers ? wildcard : [],
      studios: autoTagStudios ? wildcard : [],
      tags: autoTagTags ? wildcard : []
    };
  }

  async function onAutoTag() {
    try {
      await StashService.queryMetadataAutoTag(getAutoTagInput());
      Toast.success({ content: "Started auto tagging" });
      jobStatus.refetch();
    } catch (e) {
      Toast.error(e);
    }
  }

  function maybeRenderStop() {
    if (!status || status === "Idle") {
      return undefined;
    }

    return (
      <Form.Group>
        <Button
          id="stop"
          variant="danger"
          onClick={() =>
            StashService.queryStopJob().then(() => jobStatus.refetch())
          }
        >
          Stop
        </Button>
      </Form.Group>
    );
  }

  function renderJobStatus() {
    return (
      <>
        <Form.Group>
          <h5>Status: {status}</h5>
          {status !== "Idle" ? (
            <ProgressBar now={progress} label={`${progress}%`} />
          ) : (
            ""
          )}
        </Form.Group>
        {maybeRenderStop()}
      </>
    );
  }

  return (
    <>
      {renderImportAlert()}
      {renderCleanAlert()}

      <h4>Running Jobs</h4>

      {renderJobStatus()}

      <hr />

      <h4>Library</h4>
      <Form.Group>
        <Form.Check
          checked={useFileMetadata}
          label="Set name, date, details from metadata (if present)"
          onChange={() => setUseFileMetadata(!useFileMetadata)}
        />
        <Button id="scan" type="submit" onClick={() => onScan()}>
          Scan
        </Button>
        <Form.Text className="text-muted">
          Scan for new content and add it to the database.
        </Form.Text>
      </Form.Group>

      <hr />

      <h4>Auto Tagging</h4>

      <Form.Group>
        <Form.Check
          checked={autoTagPerformers}
          label="Performers"
          onChange={() => setAutoTagPerformers(!autoTagPerformers)}
        />
        <Form.Check
          checked={autoTagStudios}
          label="Studios"
          onChange={() => setAutoTagStudios(!autoTagStudios)}
        />
        <Form.Check
          checked={autoTagTags}
          label="Tags"
          onChange={() => setAutoTagTags(!autoTagTags)}
        />
        <Button id="autoTag" type="submit" onClick={() => onAutoTag()}>
          Auto Tag
        </Button>
        <Form.Text className="text-muted">
          Auto-tag content based on filenames.
        </Form.Text>
      </Form.Group>

      <Form.Group>
        <Button>
          <Link to="/sceneFilenameParser">Scene Filename Parser</Link>
        </Button>
      </Form.Group>

      <hr />

      <h4>Generated Content</h4>
      <GenerateButton />
      <Form.Group>
        <Button
          id="clean"
          variant="danger"
          onClick={() => setIsCleanAlertOpen(true)}
        >
          Clean
        </Button>
        <Form.Text className="text-muted">
          Check for missing files and remove them from the database. This is a
          destructive action.
        </Form.Text>
      </Form.Group>

      <hr />

      <h4>Metadata</h4>
      <Form.Group>
        <Button
          id="export"
          type="submit"
          onClick={() =>
            StashService.queryMetadataExport().then(() => {
              jobStatus.refetch();
            })
          }
        >
          Export
        </Button>
        <Form.Text className="text-muted">
          Export the database content into JSON format.
        </Form.Text>
      </Form.Group>

      <Form.Group>
        <Button
          id="import"
          variant="danger"
          onClick={() => setIsImportAlertOpen(true)}
        >
          Import
        </Button>
        <Form.Text className="text-muted">
          Import from exported JSON. This is a destructive action.
        </Form.Text>
      </Form.Group>
    </>
  );
};
