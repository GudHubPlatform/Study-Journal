import './studyjournal.webcomponent.js';

export default class GhStudyJournalData {

    /*------------------------------- FIELD TEMPLATE --------------------------------------*/

    getTemplate() {
        return {
            constructor: 'field',
            name: 'Study Journal',
            icon: 'text_icon',
            model: {
                field_id: 0,
                field_name: 'Study Journal',
                field_value: '',
                data_type: 'study_journal',
                data_model: {
                    app_id: null,
                    student_name: null,
                    interpretation: [{
                        src: 'form',
                        id: 'default',
                        settings: {
                            editable: 1,
                            show_field_name: 1,
                            show_field: 1
                        },
                        style: { position: "beetwen" }
                    }]
                }
            }
        };
    }

    /*------------------------------- INTERPRETATION --------------------------------------*/

    getInterpretation(gudhub, value, appId, itemId, field_model) {

        return [{
            id: 'default',
            name: 'Default',
            content: () =>
                '<gh-study-journal app-id="{{appId}}" item-id="{{itemId}}" field-id="{{fieldId}}"></gh-study-journal>'
        }, {
            id: 'value',
            name: 'Value',
            content: () => value
        }];
    }

    /*--------------------------  SETTINGS --------------------------------*/

    getSettings(scope) {
        return [{
            title: 'Options',
            type: 'general_setting',
            icon: 'menu',
            columns_list: [
                [
                    {
                        type: 'ghElement',
                        property: 'data_model.app_id',
                        data_model: function () {
                            return {
                                data_type: 'app',
                                field_name: 'Operations App',
                                name_space: 'operations_app',
                                data_model: {
                                    current_app: false,
                                    interpretation: [{
                                        src: 'form',
                                        id: 'with_text',
                                        settings: {
                                            editable: 1,
                                            show_field_name: 1,
                                            show_field: 1
                                        },
                                    }]
                                }
                            }
                        }
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.student_name_field_id',
                        data_model: function (fieldModel) {
                            return {
                                data_type: 'field',
                                field_name: 'Student Name',
                                name_space: 'student_name',
                                data_model: {
                                    app_id: fieldModel.data_model.app_id
                                }
                            }
                        },
                        onInit: function(settingScope, fieldModel) {
                            settingScope.$watch(function() {
                                return fieldModel.data_model.app_id;
                            }, function(newValue) {
                                settingScope.field_model.data_model.app_id = newValue;
                            });
                        }
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.point_field_id',
                        data_model: function (fieldModel) {
                            return {
                                data_type: 'field',
                                field_name: 'Point',
                                name_space: 'point',
                                data_model: {
                                    app_id: fieldModel.data_model.app_id
                                }
                            }
                        },
                        onInit: function(settingScope, fieldModel) {
                            settingScope.$watch(function() {
                                return fieldModel.data_model.app_id;
                            }, function(newValue) {
                                settingScope.field_model.data_model.app_id = newValue;
                            });
                        }
                    },
                    {
                        type: 'ghElement',
                        property: 'data_model.event_date_field_id',
                        data_model: function (fieldModel) {
                            return {
                                data_type: 'field',
                                field_name: 'Event Date',
                                name_space: 'event_date',
                                data_model: {
                                    app_id: fieldModel.data_model.app_id
                                }
                            }
                        },
                        onInit: function(settingScope, fieldModel) {
                            settingScope.$watch(function() {
                                return fieldModel.data_model.app_id;
                            }, function(newValue) {
                                settingScope.field_model.data_model.app_id = newValue;
                            });
                        }
                    }
                ]
            ]
        }];
    }
}