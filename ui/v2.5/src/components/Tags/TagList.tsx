import React, { useState } from "react";
import { Button, Form, Spinner } from 'react-bootstrap';
import { Link } from "react-router-dom";
import * as GQL from "src/core/generated-graphql";
import { StashService } from "src/core/StashService";
import { NavUtils } from "src/utils";
import { Icon, Modal } from 'src/components/Shared';
import { useToast } from 'src/hooks';

export const TagList: React.FC = () => {
  const Toast = useToast();
  // Editing / New state
  const [name, setName] = useState('');
  const [editingTag, setEditingTag] = useState<Partial<GQL.TagDataFragment> | null>(null);
  const [deletingTag, setDeletingTag] = useState<Partial<GQL.TagDataFragment> | null>(null);

  const { data, error } = StashService.useAllTags();
  const updateTag = StashService.useTagUpdate(getTagInput() as GQL.TagUpdateInput);
  const createTag = StashService.useTagCreate(getTagInput() as GQL.TagCreateInput);
  const deleteTag = StashService.useTagDestroy(getDeleteTagInput() as GQL.TagDestroyInput);

  function getTagInput() {
    const tagInput: Partial<GQL.TagCreateInput | GQL.TagUpdateInput> = { name };
    if (editingTag)
      (tagInput as Partial<GQL.TagUpdateInput>).id = editingTag.id;
    return tagInput;
  }

  function getDeleteTagInput() {
    const tagInput: Partial<GQL.TagDestroyInput> = {};
    if (deletingTag) {
        tagInput.id = deletingTag.id;
    }
    return tagInput;
  }

  async function onEdit() {
    try {
      if (editingTag && editingTag.id) {
        await updateTag();
        Toast.success({ content: "Updated tag" });
      } else {
        await createTag();
        Toast.success({ content: "Created tag" });
      }
      setEditingTag(null);
    } catch (e) {
      Toast.error(e);
    }
  }

  async function onAutoTag(tag : GQL.TagDataFragment) {
    if (!tag)
      return;
    try {
      await StashService.queryMetadataAutoTag({ tags: [tag.id]});
      Toast.success({ content: "Started auto tagging" });
    } catch (e) {
      Toast.error(e);
    }
  }

  async function onDelete() {
    try {
      await deleteTag();
      Toast.success({ content: "Deleted tag" });
      setDeletingTag(null);
    } catch (e) {
      Toast.error(e);
    }
  }

  const deleteAlert = (
    <Modal
      onHide={() => {}}
      show={!!deletingTag}
      icon="trash-alt"
      accept={{ onClick: onDelete, variant: 'danger', text: 'Delete' }}
      cancel={{ onClick: () => setDeletingTag(null) }}
    >
      <span>Are you sure you want to delete {deletingTag && deletingTag.name}?</span>
    </Modal>
  );

  if (!data?.allTags)
    return <Spinner animation="border" variant="light" />;
  if (error)
    return <div>{error.message}</div>;

  const tagElements = data.allTags.map((tag) => {
    return (
      <>
      {deleteAlert}
      <div key={tag.id} className="tag-list-row">
        <span onClick={() => setEditingTag(tag)}>{tag.name}</span>
        <div style={{float: "right"}}>
          <Button onClick={() => onAutoTag(tag)}>Auto Tag</Button>
          <Link to={NavUtils.makeTagScenesUrl(tag)}>Scenes: {tag.scene_count}</Link>
          <Link to={NavUtils.makeTagSceneMarkersUrl(tag)}>
            Markers: {tag.scene_marker_count}
          </Link>
          <span>Total: {(tag.scene_count || 0) + (tag.scene_marker_count || 0)}</span>
          <Button variant="danger" onClick={() => setDeletingTag(tag)}>
            <Icon icon="trash-alt" color="danger" />
          </Button>
        </div>
      </div>
      </>
    );
  });

  return (
    <div id="tag-list-container">
      <Button variant="primary" style={{marginTop: "20px"}} onClick={() => setEditingTag({})}>New Tag</Button>

      <Modal
        show={!!editingTag}
        header={editingTag && editingTag.id ? "Edit Tag" : "New Tag"}
        onHide={() => setEditingTag(null)}
        accept={{ onClick: onEdit, variant: 'danger', text: (editingTag?.id ? 'Update' : 'Create') }}
      >
        <Form.Group controlId="tag-name">
          <Form.Label>Name</Form.Label>
          <Form.Control
            onChange={(newValue: any) => setName(newValue.target.value)}
            defaultValue={(editingTag && editingTag.name) || ''}
          />
        </Form.Group>
      </Modal>

      {tagElements}
    </div>
  );
};