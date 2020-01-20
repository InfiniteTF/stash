/* eslint-disable no-param-reassign, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */

import React, { useEffect, useState, useCallback } from "react";
import {
  Badge,
  Button,
  Card,
  Collapse,
  Dropdown,
  DropdownButton,
  Form,
  Table,
  Spinner
} from "react-bootstrap";
import _ from "lodash";
import { StashService } from "src/core/StashService";
import * as GQL from "src/core/generated-graphql";
import { FilterSelect, Icon, StudioSelect } from "src/components/Shared";
import { TextUtils } from "src/utils";
import { useToast } from "src/hooks";
import { Pagination } from "../list/Pagination";

class ParserResult<T> {
  public value: GQL.Maybe<T>;
  public originalValue: GQL.Maybe<T>;
  public set: boolean = false;

  public setOriginalValue(v: GQL.Maybe<T>) {
    this.originalValue = v;
    this.value = v;
  }

  public setValue(v: GQL.Maybe<T>) {
    if (v) {
      this.value = v;
      this.set = !_.isEqual(this.value, this.originalValue);
    }
  }
}

class ParserField {
  public field: string;
  public helperText?: string;

  constructor(field: string, helperText?: string) {
    this.field = field;
    this.helperText = helperText;
  }

  public getFieldPattern() {
    return `{${this.field}}`;
  }

  static Title = new ParserField("title");
  static Ext = new ParserField("ext", "File extension");

  static I = new ParserField("i", "Matches any ignored word");
  static D = new ParserField("d", "Matches any delimiter (.-_)");

  static Performer = new ParserField("performer");
  static Studio = new ParserField("studio");
  static Tag = new ParserField("tag");

  // date fields
  static Date = new ParserField("date", "YYYY-MM-DD");
  static YYYY = new ParserField("yyyy", "Year");
  static YY = new ParserField("yy", "Year (20YY)");
  static MM = new ParserField("mm", "Two digit month");
  static DD = new ParserField("dd", "Two digit date");
  static YYYYMMDD = new ParserField("yyyymmdd");
  static YYMMDD = new ParserField("yymmdd");
  static DDMMYYYY = new ParserField("ddmmyyyy");
  static DDMMYY = new ParserField("ddmmyy");
  static MMDDYYYY = new ParserField("mmddyyyy");
  static MMDDYY = new ParserField("mmddyy");

  static validFields = [
    ParserField.Title,
    ParserField.Ext,
    ParserField.D,
    ParserField.I,
    ParserField.Performer,
    ParserField.Studio,
    ParserField.Tag,
    ParserField.Date,
    ParserField.YYYY,
    ParserField.YY,
    ParserField.MM,
    ParserField.DD,
    ParserField.YYYYMMDD,
    ParserField.YYMMDD,
    ParserField.DDMMYYYY,
    ParserField.DDMMYY,
    ParserField.MMDDYYYY,
    ParserField.MMDDYY
  ];

  static fullDateFields = [
    ParserField.YYYYMMDD,
    ParserField.YYMMDD,
    ParserField.DDMMYYYY,
    ParserField.DDMMYY,
    ParserField.MMDDYYYY,
    ParserField.MMDDYY
  ];
}
class SceneParserResult {
  public id: string;
  public filename: string;
  public title: ParserResult<string> = new ParserResult();
  public date: ParserResult<string> = new ParserResult();

  public studio: ParserResult<GQL.SlimSceneDataStudio> = new ParserResult();
  public studioId: ParserResult<string> = new ParserResult();
  public tags: ParserResult<GQL.SlimSceneDataTags[]> = new ParserResult();
  public tagIds: ParserResult<string[]> = new ParserResult();
  public performers: ParserResult<
    GQL.SlimSceneDataPerformers[]
  > = new ParserResult();
  public performerIds: ParserResult<string[]> = new ParserResult();

  public scene: GQL.SlimSceneDataFragment;

  constructor(result: GQL.ParseSceneFilenamesResults) {
    this.scene = result.scene;

    this.id = this.scene.id;
    this.filename = TextUtils.fileNameFromPath(this.scene.path);
    this.title.setOriginalValue(this.scene.title);
    this.date.setOriginalValue(this.scene.date);
    this.performerIds.setOriginalValue(this.scene.performers.map(p => p.id));
    this.performers.setOriginalValue(this.scene.performers);
    this.tagIds.setOriginalValue(this.scene.tags.map(t => t.id));
    this.tags.setOriginalValue(this.scene.tags);
    this.studioId.setOriginalValue(
      this.scene.studio ? this.scene.studio.id : undefined
    );
    this.studio.setOriginalValue(this.scene.studio);

    this.title.setValue(result.title);
    this.date.setValue(result.date);
    this.performerIds.setValue(result.performer_ids);
    this.tagIds.setValue(result.tag_ids);
    this.studioId.setValue(result.studio_id);

    if (result.performer_ids) {
      this.performers.setValue(
        result.performer_ids.map(p => {
          return {
            id: p,
            name: "",
            favorite: false,
            image_path: ""
          };
        })
      );
    }

    if (result.tag_ids) {
      this.tags.setValue(
        result.tag_ids.map(t => {
          return {
            id: t,
            name: ""
          };
        })
      );
    }

    if (result.studio_id) {
      this.studio.setValue({
        id: result.studio_id,
        name: "",
        image_path: ""
      });
    }
  }

  private static setInput(
    obj: any,
    key: string,
    parserResult: ParserResult<any>
  ) {
    if (parserResult.set) {
      obj[key] = parserResult.value;
    }
  }

  // returns true if any of its fields have set == true
  public isChanged() {
    return (
      this.title.set ||
      this.date.set ||
      this.performerIds.set ||
      this.studioId.set ||
      this.tagIds.set
    );
  }

  public toSceneUpdateInput() {
    const ret = {
      id: this.id,
      title: this.scene.title,
      details: this.scene.details,
      url: this.scene.url,
      date: this.scene.date,
      rating: this.scene.rating,
      gallery_id: this.scene.gallery ? this.scene.gallery.id : undefined,
      studio_id: this.scene.studio ? this.scene.studio.id : undefined,
      performer_ids: this.scene.performers.map(performer => performer.id),
      tag_ids: this.scene.tags.map(tag => tag.id)
    };

    SceneParserResult.setInput(ret, "title", this.title);
    SceneParserResult.setInput(ret, "date", this.date);
    SceneParserResult.setInput(ret, "performer_ids", this.performerIds);
    SceneParserResult.setInput(ret, "studio_id", this.studioId);
    SceneParserResult.setInput(ret, "tag_ids", this.tagIds);

    return ret;
  }
}

interface IParserInput {
  pattern: string;
  ignoreWords: string[];
  whitespaceCharacters: string;
  capitalizeTitle: boolean;
  page: number;
  pageSize: number;
  findClicked: boolean;
}

interface IParserRecipe {
  pattern: string;
  ignoreWords: string[];
  whitespaceCharacters: string;
  capitalizeTitle: boolean;
  description: string;
}

const builtInRecipes = [
  {
    pattern: "{title}",
    ignoreWords: [],
    whitespaceCharacters: "",
    capitalizeTitle: false,
    description: "Filename"
  },
  {
    pattern: "{title}.{ext}",
    ignoreWords: [],
    whitespaceCharacters: "",
    capitalizeTitle: false,
    description: "Without extension"
  },
  {
    pattern: "{}.{yy}.{mm}.{dd}.{title}.XXX.{}.{ext}",
    ignoreWords: [],
    whitespaceCharacters: ".",
    capitalizeTitle: true,
    description: ""
  },
  {
    pattern: "{}.{yy}.{mm}.{dd}.{title}.{ext}",
    ignoreWords: [],
    whitespaceCharacters: ".",
    capitalizeTitle: true,
    description: ""
  },
  {
    pattern: "{title}.XXX.{}.{ext}",
    ignoreWords: [],
    whitespaceCharacters: ".",
    capitalizeTitle: true,
    description: ""
  },
  {
    pattern: "{}.{yy}.{mm}.{dd}.{title}.{i}.{ext}",
    ignoreWords: ["cz", "fr"],
    whitespaceCharacters: ".",
    capitalizeTitle: true,
    description: "Foreign language"
  }
];

const initialParserInput = {
  pattern: "{title}.{ext}",
  ignoreWords: [],
  whitespaceCharacters: "._",
  capitalizeTitle: true,
  page: 1,
  pageSize: 20,
  findClicked: false
};

const initialShowFieldsState = new Map<string, boolean>([
  ["Title", true],
  ["Date", true],
  ["Performers", true],
  ["Tags", true],
  ["Studio", true]
]);

export const SceneFilenameParser: React.FC = () => {
  const Toast = useToast();
  const [parserResult, setParserResult] = useState<SceneParserResult[]>([]);
  const [parserInput, setParserInput] = useState<IParserInput>(
    initialParserInput
  );

  const [allTitleSet, setAllTitleSet] = useState<boolean>(false);
  const [allDateSet, setAllDateSet] = useState<boolean>(false);
  const [allPerformerSet, setAllPerformerSet] = useState<boolean>(false);
  const [allTagSet, setAllTagSet] = useState<boolean>(false);
  const [allStudioSet, setAllStudioSet] = useState<boolean>(false);

  const [showFields, setShowFields] = useState<Map<string, boolean>>(
    initialShowFieldsState
  );

  const [totalItems, setTotalItems] = useState<number>(0);

  // Network state
  const [isLoading, setIsLoading] = useState(false);

  const updateScenes = StashService.useScenesUpdate(getScenesUpdateData());

  const determineFieldsToHide = useCallback(() => {
    const { pattern } = parserInput;
    const titleSet = pattern.includes("{title}");
    const dateSet =
      pattern.includes("{date}") ||
      pattern.includes("{dd}") || // don't worry about other partial date fields since this should be implied
      ParserField.fullDateFields.some(f => {
        return pattern.includes(`{${f.field}}`);
      });
    const performerSet = pattern.includes("{performer}");
    const tagSet = pattern.includes("{tag}");
    const studioSet = pattern.includes("{studio}");

    const newShowFields = new Map<string, boolean>([
      ["Title", titleSet],
      ["Date", dateSet],
      ["Performers", performerSet],
      ["Tags", tagSet],
      ["Studio", studioSet]
    ]);

    setShowFields(newShowFields);
  }, [parserInput]);

  const parseResults = useCallback(
    (results: GQL.ParseSceneFilenamesResults[]) => {
      if (results) {
        const result = results
          .map(r => {
            return new SceneParserResult(r);
          })
          .filter(r => !!r) as SceneParserResult[];

        setParserResult(result);
        determineFieldsToHide();
      }
    },
    [determineFieldsToHide]
  );

  useEffect(() => {
    if (parserInput.findClicked) {
      setParserResult([]);
      setIsLoading(true);

      const parserFilter = {
        q: parserInput.pattern,
        page: parserInput.page,
        per_page: parserInput.pageSize,
        sort: "path",
        direction: GQL.SortDirectionEnum.Asc
      };

      const parserInputData = {
        ignoreWords: parserInput.ignoreWords,
        whitespaceCharacters: parserInput.whitespaceCharacters,
        capitalizeTitle: parserInput.capitalizeTitle
      };

      StashService.queryParseSceneFilenames(parserFilter, parserInputData)
        .then(response => {
          const result = response.data.parseSceneFilenames;
          if (result) {
            parseResults(result.results);
            setTotalItems(result.count);
          }
        })
        .catch(err => Toast.error(err))
        .finally(() => setIsLoading(false));
    }
  }, [parserInput, parseResults, Toast]);

  function onPageSizeChanged(newSize: number) {
    const newInput = _.clone(parserInput);
    newInput.page = 1;
    newInput.pageSize = newSize;
    setParserInput(newInput);
  }

  function onPageChanged(newPage: number) {
    if (newPage !== parserInput.page) {
      const newInput = _.clone(parserInput);
      newInput.page = newPage;
      setParserInput(newInput);
    }
  }

  function onFindClicked(input: IParserInput) {
    input.page = 1;
    input.findClicked = true;
    setParserInput(input);
    setTotalItems(0);
  }

  function getScenesUpdateData() {
    return parserResult
      .filter(result => result.isChanged())
      .map(result => result.toSceneUpdateInput());
  }

  async function onApply() {
    setIsLoading(true);

    try {
      await updateScenes();
      Toast.success({ content: "Updated scenes" });
    } catch (e) {
      Toast.error(e);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    const newAllTitleSet = !parserResult.some(r => {
      return !r.title.set;
    });
    const newAllDateSet = !parserResult.some(r => {
      return !r.date.set;
    });
    const newAllPerformerSet = !parserResult.some(r => {
      return !r.performerIds.set;
    });
    const newAllTagSet = !parserResult.some(r => {
      return !r.tagIds.set;
    });
    const newAllStudioSet = !parserResult.some(r => {
      return !r.studioId.set;
    });

    setAllTitleSet(newAllTitleSet);
    setAllDateSet(newAllDateSet);
    setAllTagSet(newAllPerformerSet);
    setAllTagSet(newAllTagSet);
    setAllStudioSet(newAllStudioSet);
  }, [parserResult]);

  function onSelectAllTitleSet(selected: boolean) {
    const newResult = [...parserResult];

    newResult.forEach(r => {
      r.title.set = selected;
    });

    setParserResult(newResult);
    setAllTitleSet(selected);
  }

  function onSelectAllDateSet(selected: boolean) {
    const newResult = [...parserResult];

    newResult.forEach(r => {
      r.date.set = selected;
    });

    setParserResult(newResult);
    setAllDateSet(selected);
  }

  function onSelectAllPerformerSet(selected: boolean) {
    const newResult = [...parserResult];

    newResult.forEach(r => {
      r.performerIds.set = selected;
    });

    setParserResult(newResult);
    setAllPerformerSet(selected);
  }

  function onSelectAllTagSet(selected: boolean) {
    const newResult = [...parserResult];

    newResult.forEach(r => {
      r.tagIds.set = selected;
    });

    setParserResult(newResult);
    setAllTagSet(selected);
  }

  function onSelectAllStudioSet(selected: boolean) {
    const newResult = [...parserResult];

    newResult.forEach(r => {
      r.studioId.set = selected;
    });

    setParserResult(newResult);
    setAllStudioSet(selected);
  }

  interface IShowFieldsProps {
    fields: Map<string, boolean>;
    onShowFieldsChanged: (fields: Map<string, boolean>) => void;
  }

  function ShowFields(props: IShowFieldsProps) {
    const [open, setOpen] = useState(false);

    function handleClick(label: string) {
      const copy = new Map<string, boolean>(props.fields);
      copy.set(label, !props.fields.get(label));
      props.onShowFieldsChanged(copy);
    }

    const fieldRows = [...props.fields.entries()].map(([label, enabled]) => (
      <div
        key={label}
        onClick={() => {
          handleClick(label);
        }}
      >
        <Icon icon={enabled ? "check" : "times"} />
        <span>{label}</span>
      </div>
    ));

    return (
      <div>
        <div onClick={() => setOpen(!open)}>
          <Icon icon={open ? "chevron-down" : "chevron-right"} />
          <span>Display fields</span>
        </div>
        <Collapse in={open}>
          <div>{fieldRows}</div>
        </Collapse>
      </div>
    );
  }

  interface IParserInputProps {
    input: IParserInput;
    onFind: (input: IParserInput) => void;
  }

  function ParserInput(props: IParserInputProps) {
    const [pattern, setPattern] = useState<string>(props.input.pattern);
    const [ignoreWords, setIgnoreWords] = useState<string>(
      props.input.ignoreWords.join(" ")
    );
    const [whitespaceCharacters, setWhitespaceCharacters] = useState<string>(
      props.input.whitespaceCharacters
    );
    const [capitalizeTitle, setCapitalizeTitle] = useState<boolean>(
      props.input.capitalizeTitle
    );

    function onFind() {
      props.onFind({
        pattern,
        ignoreWords: ignoreWords.split(" "),
        whitespaceCharacters,
        capitalizeTitle,
        page: 1,
        pageSize: props.input.pageSize,
        findClicked: props.input.findClicked
      });
    }

    function setParserRecipe(recipe: IParserRecipe) {
      setPattern(recipe.pattern);
      setIgnoreWords(recipe.ignoreWords.join(" "));
      setWhitespaceCharacters(recipe.whitespaceCharacters);
      setCapitalizeTitle(recipe.capitalizeTitle);
    }

    const validFields = [new ParserField("", "Wildcard")].concat(
      ParserField.validFields
    );

    function addParserField(field: ParserField) {
      setPattern(pattern + field.getFieldPattern());
    }

    const PAGE_SIZE_OPTIONS = ["20", "40", "60", "120"];

    return (
      <Form.Group>
        <Form.Group>
          <Form.Control
            onChange={(newValue: any) => setPattern(newValue.target.value)}
            value={pattern}
          />
          <DropdownButton id="parser-field-select" title="Add Field">
            {validFields.map(item => (
              <Dropdown.Item onSelect={() => addParserField(item)}>
                <span>{item.field}</span>
                <span className="ml-auto">{item.helperText}</span>
              </Dropdown.Item>
            ))}
          </DropdownButton>
          <div>Use &apos;\\&apos; to escape literal {} characters</div>
        </Form.Group>

        <Form.Group>
          <Form.Label>Ignored words::</Form.Label>
          <Form.Control
            onChange={(newValue: any) => setIgnoreWords(newValue.target.value)}
            value={ignoreWords}
          />
          <div>Matches with {"{i}"}</div>
        </Form.Group>

        <Form.Group>
          <h5>Title</h5>
          <Form.Label>Whitespace characters:</Form.Label>
          <Form.Control
            onChange={(newValue: any) =>
              setWhitespaceCharacters(newValue.target.value)
            }
            value={whitespaceCharacters}
          />
          <Form.Group>
            <Form.Label>Capitalize title</Form.Label>
            <Form.Control
              type="checkbox"
              checked={capitalizeTitle}
              onChange={() => setCapitalizeTitle(!capitalizeTitle)}
            />
          </Form.Group>
          <div>
            These characters will be replaced with whitespace in the title
          </div>
        </Form.Group>

        {/* TODO - mapping stuff will go here */}

        <Form.Group>
          <DropdownButton id="recipe-select" title="Select Parser Recipe">
            {builtInRecipes.map(item => (
              <Dropdown.Item onSelect={() => setParserRecipe(item)}>
                <span>{item.pattern}</span>
                <span className="mr-auto">{item.description}</span>
              </Dropdown.Item>
            ))}
          </DropdownButton>
        </Form.Group>

        <Form.Group>
          <ShowFields
            fields={showFields}
            onShowFieldsChanged={fields => setShowFields(fields)}
          />
        </Form.Group>

        <Form.Group>
          <Button onClick={onFind}>Find</Button>
          <Form.Control
            as="select"
            style={{ flexBasis: "min-content" }}
            options={PAGE_SIZE_OPTIONS}
            onChange={(event: any) =>
              onPageSizeChanged(parseInt(event.target.value, 10))
            }
            defaultValue={props.input.pageSize}
            className="filter-item"
          >
            {PAGE_SIZE_OPTIONS.map(val => (
              <option value="val">{val}</option>
            ))}
          </Form.Control>
        </Form.Group>
      </Form.Group>
    );
  }

  interface ISceneParserFieldProps {
    parserResult: ParserResult<any>;
    className?: string;
    fieldName: string;
    onSetChanged: (set: boolean) => void;
    onValueChanged: (value: any) => void;
    originalParserResult?: ParserResult<any>;
    renderOriginalInputField: (props: ISceneParserFieldProps) => JSX.Element;
    renderNewInputField: (
      props: ISceneParserFieldProps,
      onChange: (event: any) => void
    ) => JSX.Element;
  }

  function SceneParserField(props: ISceneParserFieldProps) {
    function maybeValueChanged(value: any) {
      if (value !== props.parserResult.value) {
        props.onValueChanged(value);
      }
    }

    if (!showFields.get(props.fieldName)) {
      return null;
    }

    return (
      <>
        <td>
          <Form.Control
            type="checkbox"
            checked={props.parserResult.set}
            onChange={() => {
              props.onSetChanged(!props.parserResult.set);
            }}
          />
        </td>
        <td>
          <Form.Group>
            {props.renderOriginalInputField(props)}
            {props.renderNewInputField(props, value =>
              maybeValueChanged(value)
            )}
          </Form.Group>
        </td>
      </>
    );
  }

  function renderOriginalInputGroup(props: ISceneParserFieldProps) {
    const result = props.originalParserResult || props.parserResult;

    return (
      <Form.Control
        disabled
        className={props.className}
        defaultValue={result.originalValue || ""}
      />
    );
  }

  interface IInputGroupWrapperProps {
    parserResult: ParserResult<any>;
    onChange: (event: any) => void;
    className?: string;
  }

  function InputGroupWrapper(props: IInputGroupWrapperProps) {
    return (
      <Form.Control
        disabled={!props.parserResult.set}
        className={props.className}
        value={props.parserResult.value || ""}
        onBlur={(event: any) => props.onChange(event.target.value)}
      />
    );
  }

  function renderNewInputGroup(
    props: ISceneParserFieldProps,
    onChangeHandler: (value: any) => void
  ) {
    return (
      <InputGroupWrapper
        className={props.className}
        onChange={(value: any) => {
          onChangeHandler(value);
        }}
        parserResult={props.parserResult}
      />
    );
  }

  interface IHasName {
    name: string;
  }

  function renderOriginalSelect(props: ISceneParserFieldProps) {
    const result = props.originalParserResult || props.parserResult;

    const elements = result.originalValue
      ? Array.isArray(result.originalValue)
        ? result.originalValue.map((el: IHasName) => el.name)
        : [result.originalValue.name]
      : [];

    return (
      <div>
        {elements.map((name: string) => (
          <Badge variant="secondary">{name}</Badge>
        ))}
      </div>
    );
  }

  function renderNewMultiSelect(
    type: "performers" | "tags",
    props: ISceneParserFieldProps,
    onChangeHandler: (value: any) => void
  ) {
    return (
      <FilterSelect
        className={props.className}
        type={type}
        isMulti
        onSelect={items => {
          const ids = items.map(i => i.id);
          onChangeHandler(ids);
        }}
        initialIds={props.parserResult.value}
      />
    );
  }

  function renderNewPerformerSelect(
    props: ISceneParserFieldProps,
    onChangeHandler: (value: any) => void
  ) {
    return renderNewMultiSelect("performers", props, onChangeHandler);
  }

  function renderNewTagSelect(
    props: ISceneParserFieldProps,
    onChangeHandler: (value: any) => void
  ) {
    return renderNewMultiSelect("tags", props, onChangeHandler);
  }

  function renderNewStudioSelect(
    props: ISceneParserFieldProps,
    onChangeHandler: (value: any) => void
  ) {
    return (
      <StudioSelect
        noSelectionString=""
        className={props.className}
        onSelect={items => onChangeHandler(items[0]?.id)}
        initialIds={props.parserResult.value ? [props.parserResult.value] : []}
      />
    );
  }

  interface ISceneParserRowProps {
    scene: SceneParserResult;
    onChange: (changedScene: SceneParserResult) => void;
  }

  function SceneParserRow(props: ISceneParserRowProps) {
    function changeParser(result: ParserResult<any>, set: boolean, value: any) {
      const newParser = _.clone(result);
      newParser.set = set;
      newParser.value = value;
      return newParser;
    }

    function onTitleChanged(set: boolean, value: string | undefined) {
      const newResult = _.clone(props.scene);
      newResult.title = changeParser(newResult.title, set, value);
      props.onChange(newResult);
    }

    function onDateChanged(set: boolean, value: string | undefined) {
      const newResult = _.clone(props.scene);
      newResult.date = changeParser(newResult.date, set, value);
      props.onChange(newResult);
    }

    function onPerformerIdsChanged(set: boolean, value: string[] | undefined) {
      const newResult = _.clone(props.scene);
      newResult.performerIds = changeParser(newResult.performerIds, set, value);
      props.onChange(newResult);
    }

    function onTagIdsChanged(set: boolean, value: string[] | undefined) {
      const newResult = _.clone(props.scene);
      newResult.tagIds = changeParser(newResult.tagIds, set, value);
      props.onChange(newResult);
    }

    function onStudioIdChanged(set: boolean, value: string | undefined) {
      const newResult = _.clone(props.scene);
      newResult.studioId = changeParser(newResult.studioId, set, value);
      props.onChange(newResult);
    }

    return (
      <tr className="scene-parser-row">
        <td style={{ textAlign: "left" }}>{props.scene.filename}</td>
        <SceneParserField
          key="title"
          fieldName="Title"
          className="parser-field-title"
          parserResult={props.scene.title}
          onSetChanged={set => onTitleChanged(set, props.scene.title.value)}
          onValueChanged={value => onTitleChanged(props.scene.title.set, value)}
          renderOriginalInputField={renderOriginalInputGroup}
          renderNewInputField={renderNewInputGroup}
        />
        <SceneParserField
          key="date"
          fieldName="Date"
          className="parser-field-date"
          parserResult={props.scene.date}
          onSetChanged={set => onDateChanged(set, props.scene.date.value)}
          onValueChanged={value => onDateChanged(props.scene.date.set, value)}
          renderOriginalInputField={renderOriginalInputGroup}
          renderNewInputField={renderNewInputGroup}
        />
        <SceneParserField
          key="performers"
          fieldName="Performers"
          className="parser-field-performers"
          parserResult={props.scene.performerIds}
          originalParserResult={props.scene.performers}
          onSetChanged={set =>
            onPerformerIdsChanged(set, props.scene.performerIds.value)
          }
          onValueChanged={value =>
            onPerformerIdsChanged(props.scene.performerIds.set, value)
          }
          renderOriginalInputField={renderOriginalSelect}
          renderNewInputField={renderNewPerformerSelect}
        />
        <SceneParserField
          key="tags"
          fieldName="Tags"
          className="parser-field-tags"
          parserResult={props.scene.tagIds}
          originalParserResult={props.scene.tags}
          onSetChanged={set => onTagIdsChanged(set, props.scene.tagIds.value)}
          onValueChanged={value =>
            onTagIdsChanged(props.scene.tagIds.set, value)
          }
          renderOriginalInputField={renderOriginalSelect}
          renderNewInputField={renderNewTagSelect}
        />
        <SceneParserField
          key="studio"
          fieldName="Studio"
          className="parser-field-studio"
          parserResult={props.scene.studioId}
          originalParserResult={props.scene.studio}
          onSetChanged={set =>
            onStudioIdChanged(set, props.scene.studioId.value)
          }
          onValueChanged={value =>
            onStudioIdChanged(props.scene.studioId.set, value)
          }
          renderOriginalInputField={renderOriginalSelect}
          renderNewInputField={renderNewStudioSelect}
        />
      </tr>
    );
  }

  function onChange(scene: SceneParserResult, changedScene: SceneParserResult) {
    const newResult = [...parserResult];

    const index = newResult.indexOf(scene);
    newResult[index] = changedScene;

    setParserResult(newResult);
  }

  function renderHeader(
    fieldName: string,
    allSet: boolean,
    onAllSet: (set: boolean) => void
  ) {
    if (!showFields.get(fieldName)) {
      return null;
    }

    return (
      <>
        <td>
          <Form.Control
            type="checkbox"
            checked={allSet}
            onChange={() => {
              onAllSet(!allSet);
            }}
          />
        </td>
        <th>{fieldName}</th>
      </>
    );
  }

  function renderTable() {
    if (parserResult.length === 0) {
      return undefined;
    }

    return (
      <>
        <div>
          <div className="scene-parser-results">
            <Table>
              <thead>
                <tr className="scene-parser-row">
                  <th>Filename</th>
                  {renderHeader("Title", allTitleSet, onSelectAllTitleSet)}
                  {renderHeader("Date", allDateSet, onSelectAllDateSet)}
                  {renderHeader(
                    "Performers",
                    allPerformerSet,
                    onSelectAllPerformerSet
                  )}
                  {renderHeader("Tags", allTagSet, onSelectAllTagSet)}
                  {renderHeader("Studio", allStudioSet, onSelectAllStudioSet)}
                </tr>
              </thead>
              <tbody>
                {parserResult.map(scene => (
                  <SceneParserRow
                    scene={scene}
                    key={scene.id}
                    onChange={changedScene => onChange(scene, changedScene)}
                  />
                ))}
              </tbody>
            </Table>
          </div>
          <Pagination
            currentPage={parserInput.page}
            itemsPerPage={parserInput.pageSize}
            totalItems={totalItems}
            onChangePage={page => onPageChanged(page)}
          />
          <Button variant="primary" onClick={onApply}>
            Apply
          </Button>
        </div>
      </>
    );
  }

  return (
    <Card id="parser-container">
      <h4>Scene Filename Parser</h4>
      <ParserInput input={parserInput} onFind={input => onFindClicked(input)} />

      {isLoading ? <Spinner animation="border" variant="light" /> : undefined}
      {renderTable()}
    </Card>
  );
};