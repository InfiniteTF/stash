import _ from "lodash";
import React, { useEffect, useRef, useState } from "react";
import { Button, Form, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Icon, FilterSelect } from "src/components/Shared";
import { CriterionModifier } from "src/core/generated-graphql";
import {
  Criterion,
  CriterionType
} from "src/models/list-filter/criteria/criterion";
import { NoneCriterion } from "src/models/list-filter/criteria/none";
import { PerformersCriterion } from "src/models/list-filter/criteria/performers";
import { StudiosCriterion } from "src/models/list-filter/criteria/studios";
import { TagsCriterion } from "src/models/list-filter/criteria/tags";
import { makeCriteria } from "src/models/list-filter/criteria/utils";
import { ListFilterModel } from "src/models/list-filter/filter";

interface IAddFilterProps {
  onAddCriterion: (criterion: Criterion, oldId?: string) => void;
  onCancel: () => void;
  filter: ListFilterModel;
  editingCriterion?: Criterion;
}

export const AddFilter: React.FC<IAddFilterProps> = (
  props: IAddFilterProps
) => {
  const defaultValue = useRef<string | number | undefined>();

  const [isOpen, setIsOpen] = useState(false);
  const [criterion, setCriterion] = useState<Criterion<any, any>>(
    new NoneCriterion()
  );

  const valueStage = useRef<any>(criterion.value);

  // Configure if we are editing an existing criterion
  useEffect(() => {
    if (!props.editingCriterion) {
      return;
    }
    setIsOpen(true);
    setCriterion(props.editingCriterion);
  }, [props.editingCriterion]);

  function onChangedCriteriaType(event: React.ChangeEvent<HTMLSelectElement>) {
    const newCriterionType = event.target.value as CriterionType;
    const newCriterion = makeCriteria(newCriterionType);
    setCriterion(newCriterion);
  }

  function onChangedModifierSelect(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const newCriterion = _.cloneDeep(criterion);
    newCriterion.modifier = event.target.value as any;
    setCriterion(newCriterion);
  }

  function onChangedSingleSelect(event: React.ChangeEvent<HTMLSelectElement>) {
    const newCriterion = _.cloneDeep(criterion);
    newCriterion.value = event.target.value;
    setCriterion(newCriterion);
  }

  function onChangedInput(event: React.ChangeEvent<HTMLInputElement>) {
    valueStage.current = event.target.value;
  }

  function onBlurInput() {
    const newCriterion = _.cloneDeep(criterion);
    newCriterion.value = valueStage.current;
    setCriterion(newCriterion);
  }

  function onAddFilter() {
    if (!Array.isArray(criterion.value) && defaultValue.current) {
      const value = defaultValue.current;
      if (
        criterion.options &&
        (value === undefined || value === "" || typeof value === "number")
      ) {
        criterion.value = criterion.options[0];
      } else if (typeof value === "number" && value === undefined) {
        criterion.value = 0;
      } else if (value === undefined) {
        criterion.value = "";
      }
    }
    const oldId = props.editingCriterion
      ? props.editingCriterion.getId()
      : undefined;
    props.onAddCriterion(criterion, oldId);
    onToggle();
  }

  function onToggle() {
    if (isOpen) {
      props.onCancel();
    }
    setIsOpen(!isOpen);
    setCriterion(makeCriteria());
  }

  const maybeRenderFilterPopoverContents = () => {
    if (criterion.type === "none") {
      return;
    }

    function renderModifier() {
      if (criterion.modifierOptions.length === 0) {
        return;
      }
      return (
        <div>
          <Form.Control
            as="select"
            onChange={onChangedModifierSelect}
            value={criterion.modifier}
          >
            {criterion.modifierOptions.map(c => (
              <option value={c.value}>{c.label}</option>
            ))}
          </Form.Control>
        </div>
      );
    }

    function renderSelect() {
      // Hide the value select if the modifier is "IsNull" or "NotNull"
      if (
        criterion.modifier === CriterionModifier.IsNull ||
        criterion.modifier === CriterionModifier.NotNull
      ) {
        return;
      }

      if (Array.isArray(criterion.value)) {
        let type: "performers" | "studios" | "tags";
        if (criterion instanceof PerformersCriterion) {
          type = "performers";
        } else if (criterion instanceof StudiosCriterion) {
          type = "studios";
        } else if (criterion instanceof TagsCriterion) {
          type = "tags";
        } else {
          return;
        }

        return (
          <FilterSelect
            type={type}
            onSelect={items => {
              criterion.value = items.map(i => ({ id: i.id, label: i.name! }));
            }}
            initialIds={criterion.value.map((labeled: any) => labeled.id)}
          />
        );
      }
      if (criterion.options) {
        defaultValue.current = criterion.value;
        return (
          <Form.Control
            as="select"
            onChange={onChangedSingleSelect}
            value={criterion.value}
          >
            {criterion.options.map(c => (
              <option value={c}>{c}</option>
            ))}
          </Form.Control>
        );
      }
      return (
        <Form.Control
          type={criterion.inputType}
          onChange={onChangedInput}
          onBlur={onBlurInput}
          value={criterion.value || ""}
        />
      );
    }
    return (
      <>
        <Form.Group>{renderModifier()}</Form.Group>
        <Form.Group>{renderSelect()}</Form.Group>
      </>
    );
  };

  function maybeRenderFilterSelect() {
    if (props.editingCriterion) {
      return;
    }
    return (
      <Form.Group controlId="filter">
        <Form.Label>Filter</Form.Label>
        <Form.Control
          as="select"
          onChange={onChangedCriteriaType}
          value={criterion.type}
        >
          {props.filter.criterionOptions.map(c => (
            <option value={c.value}>{c.label}</option>
          ))}
        </Form.Control>
      </Form.Group>
    );
  }

  const title = !props.editingCriterion ? "Add Filter" : "Update Filter";
  return (
    <>
      <OverlayTrigger
        placement="top"
        overlay={<Tooltip id="filter-tooltip">Filter</Tooltip>}
      >
        <Button onClick={() => onToggle()} active={isOpen}>
          <Icon icon="filter" />
        </Button>
      </OverlayTrigger>

      <Modal show={isOpen} onHide={() => onToggle()}>
        <Modal.Header>{title}</Modal.Header>
        <Modal.Body>
          <div className="dialog-content">
            {maybeRenderFilterSelect()}
            {maybeRenderFilterPopoverContents()}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onAddFilter} disabled={criterion.type === "none"}>
            {title}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
